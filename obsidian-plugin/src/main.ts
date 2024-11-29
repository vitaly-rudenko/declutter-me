import { format } from 'date-fns'
import { App, normalizePath, Notice, Plugin, PluginSettingTab, Setting, SuggestModal } from 'obsidian'
import { z } from 'zod'
import { match, MatchResult } from './templater/match.js'

const routeSchema = z.object({
	template: z.string(),
	path: z.string(),
	content: z.string(),
	mode: z.enum(['appendLineAfterContent', 'prependLineBeforeContent']).optional(),
	leaf: z.enum(['split', 'tab', 'window']).optional(),
	skipProperties: z.boolean().optional(),
})

type Route = z.infer<typeof routeSchema>

type DeclutterMePluginSettings = {
	routes: Route[]
}

const routesSchema = z.array(routeSchema)

// TODO: section
// TODO: fileTemplate

const routesExample: Route[] = [
	{
		template: 'w {note}',
		path: '5 Test/2 Work/Tasks/{date:yyyy} from {device}.md',
		content: '- [ ] {note}',
	},
	{
		template: 'p {note}',
		path: '5 Test/1 Personal/Tasks/{date:yyyy} from {device}.md',
		content: '- [ ] {note}',
		leaf: 'split',
	},
	{
		template: 'JIRA-{id:number} {note}',
		path: '5 Test/2 Work/Tickets/JIRA-{id} from {device}.md',
		content: '- [ ] {note}',
		mode: 'prependLineBeforeContent',
		leaf: 'tab',
	}
]

const DEFAULT_SETTINGS: DeclutterMePluginSettings = {
	// routes: [],
	routes: routesExample,
}

function replaceVariables(input: string, variables: Record<string, string>) {
  let result = input
  for (const [name, value] of Object.entries(variables)) {
    const variableName = '{' + name + '}'
    while (result.includes(variableName)) {
      result = result.replace(variableName, value)
    }
  }
  return result.replace(/\{date:(.+?)\}/i, (_, dateFormat) => format(new Date(), dateFormat))
}

export class ExampleModal extends SuggestModal<Route> {
  private query = '';

  constructor(app: App, private readonly onTrigger: (query: string) => void) {
	super(app)
  }

  getSuggestions(query: string): Route[] {
    this.query = query

    const matchedRoutes = routesExample.filter((route) =>
      match(query, route.template) !== undefined
    );
	if (matchedRoutes.length === 0) {
		return routesExample
	}
	return matchedRoutes
  }

  renderSuggestion(route: Route, el: HTMLElement) {
	const variables: Record<string, string> = {
		device: 'Personal Macbook'
	}

    const matchResult = match(this.query, route.template)
    if (!matchResult) {
		el.createEl('div', { text: route.template });
		el.createEl('small', { text: replaceVariables(route.path, variables) });
		return
	}

    for (const [variableName, { value }] of Object.entries(matchResult)) {
      variables[variableName] = String(value)
    }

    el.createEl('div', { text: replaceVariables(route.content, variables) });
    el.createEl('small', { text: replaceVariables(route.path, variables) });
  }

  onChooseSuggestion(route: Route, evt: MouseEvent | KeyboardEvent) {
	if (!this.query) return
    this.onTrigger(this.query)
  }
}

function getIndexOfFirstNonEmptyLine(lines: string[], options?: { skipProperties?: boolean }) {
	let startWithIndex = 0
	if (lines[0] === '---' && lines.indexOf('---', 1) !== -1 && options?.skipProperties) {
		startWithIndex = lines.indexOf('---', 1) + 1
	}

	let index = lines.findIndex((line, index) => index >= startWithIndex && line.trim() !== '')
	if (index === -1) index = startWithIndex
	return index
}

function getIndexAfterLastNonEmptyLine(lines: string[], options?: { skipProperties?: boolean }) {
	let startWithIndex = 0
	if (lines[0] === '---' && lines.indexOf('---', 1) !== -1 && options?.skipProperties) {
		startWithIndex = lines.indexOf('---', 1) + 1
	}

	let index = lines.findLastIndex(line => line.trim() !== '')
	if (index === -1) index = startWithIndex
	return index + 1
}

export default class DeclutterMePlugin extends Plugin {
	settings: DeclutterMePluginSettings = DEFAULT_SETTINGS

	async handleQuery(input: string, inputVariables: Record<string, string>) {
		let matchedRoute: Route | undefined
		let matchResult: MatchResult | undefined
		for (const route of this.settings.routes) {
			matchedRoute = route
			matchResult = match(input, route.template)
			if (matchResult) break
		}
		if (!matchedRoute || !matchResult) return // TODO: warning

		const variables: Record<string, string> = {
			device: 'Personal Macbook',
			...inputVariables
		}

		for (const [variableName, { value }] of Object.entries(matchResult)) {
			variables[variableName] = String(value)
		}

		const path = normalizePath(replaceVariables(matchedRoute.path, variables))

		let file = this.app.vault.getFileByPath(path)
		if (!file) {
			console.debug('Creating new file:', path)

			if (path.includes('/')) {
				try {
					await this.app.vault.createFolder(path.split('/').slice(0, -1).join('/'))
				} catch { /* ignore */ }
			}

			file = await this.app.vault.create(path, '')
		}

		const fileData = await this.app.vault.read(file)

		const mode: Route['mode'] = matchedRoute.mode ?? 'appendLineAfterContent'
		const skipProperties = matchedRoute.skipProperties !== false

		const lines = fileData.split('\n')
		const index = mode === 'appendLineAfterContent'
			? getIndexAfterLastNonEmptyLine(lines)
			: getIndexOfFirstNonEmptyLine(lines, { skipProperties })
		const content = replaceVariables(matchedRoute.content, variables)
		lines.splice(index, 0, content)

		const dataToWrite = lines.join('\n')
		console.debug({ input, variables, path, dataToWrite })

		await this.app.vault.modify(file, dataToWrite)

		if (matchedRoute.leaf) {
			const leaf = this.app.workspace.getLeaf(matchedRoute.leaf)
			await leaf.openFile(file)
		}

		new Notice(`Note saved\n${path.split('/').at(-1)?.replace(/\.md$/, '')}`)
	}

	async onload() {
		await this.loadSettings()

		this.addSettingTab(new SampleSettingTab(this.app, this))

		this.addCommand({
			id: 'declutter-me-spotlight',
			name: 'Spotlight',
			callback: () => {
				new ExampleModal(this.app, async (query) => {
					await this.handleQuery(query, {})
				}).open()
			}
		})

		this.registerObsidianProtocolHandler('declutter-me', async (event) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { action, input, ...inputVariables } = event as { action: string; input: string; [key: string]: string }
			await this.handleQuery(input, inputVariables)
		})
	}

	onunload() {}

	async loadSettings() {
		// this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() }
		this.settings = { ...DEFAULT_SETTINGS }
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: DeclutterMePlugin

	constructor(app: App, plugin: DeclutterMePlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		this.containerEl.empty()
		this.containerEl.createEl('h2', { text: this.plugin.manifest.name })

		new Setting(this.containerEl)
			.setName('Routes')
			.setDesc('In JSON format')
			.addTextArea((textArea) => {
				textArea.inputEl.rows = 20
				textArea.inputEl.cols = 60

				return textArea
					.setPlaceholder(JSON.stringify(routesExample, null, 2))
					.setValue(JSON.stringify(this.plugin.settings.routes, null, 2))
					.onChange(async (value) => {
						try {
							this.plugin.settings.routes = routesSchema.parse(JSON.parse(value))
						} catch { /* ignore */ }

						await this.plugin.saveSettings()
					})
			})
	}
}
