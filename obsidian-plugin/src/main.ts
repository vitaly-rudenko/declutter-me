import { format } from 'date-fns'
import { App, normalizePath, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { z } from 'zod';
import { match, MatchResult } from './templater/match.js';

const DEFAULT_SETTINGS: DeclutterMePluginSettings = {
	routes: [],
}

const routeSchema = z.object({
	template: z.string(),
	path: z.string(),
	content: z.string(),
	mode: z.enum(['append', 'prepend']).default('append').optional(),
	leaf: z.enum(['split', 'tab', 'window']).optional(),
})

type Route = z.infer<typeof routeSchema>

type DeclutterMePluginSettings = {
	routes: Route[];
}

const routesSchema = z.array(routeSchema)

// TODO: append/prepend modes
// TODO: section
// TODO: fileTemplate

const routesExample: Route[] = [
	{
		template: 'w {note}',
		path: '5 Test/2 Work/Tasks/{date:YYYY} from {device}.md',
		content: '- [ ] {note}',
	},
	{
		template: 'p {note}',
		path: '5 Test/1 Personal/Tasks/{date:YYYY} from {device}.md',
		content: '- [ ] {note}',
		leaf: 'split',
	},
	{
		template: 'JIRA-{id:number} {note}',
		path: '5 Test/2 Work/Tickets/JIRA-{id} from {device}.md',
		content: '- [ ] {note}',
		mode: 'prepend',
		leaf: 'tab',
	}
];

export default class DeclutterMePlugin extends Plugin {
	settings: DeclutterMePluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerObsidianProtocolHandler('declutter-me', async (event) => {
			const { action, input, ...inputVariables } = event as { action: string; input: string; [key: string]: string };

			let matchedRoute: Route | undefined
			let matchResult: MatchResult | undefined
			for (const route of this.settings.routes) {
				matchedRoute = route
				matchResult = match(input, route.template)
				if (matchResult) break
			}
			if (!matchedRoute || !matchResult) return // TODO: warning

			const variables = { ...inputVariables }
			for (const [variableName, { value }] of Object.entries(matchResult)) {
				variables[variableName] = String(value)
			}

			function replaceVariables(input: string, variables: Record<string, string>) {
				let result = input
				for (const [name, value] of Object.entries(variables)) {
					const variableName = '{' + name + '}'
					while (result.includes(variableName)) {
						result = result.replace(variableName, value)
					}
				}
				return result.replace(/\{date:(?<format>.+?)\}/i, (dateFormat) => format(new Date(), dateFormat))
			}

			const path = normalizePath(replaceVariables(matchedRoute.path, variables))

			let file = this.app.vault.getFileByPath(path)
			if (!file) {
				if (path.includes('/')) {
					try {
						await this.app.vault.createFolder(path.split('/').slice(0, -1).join('/'))
					} catch { /* ignore */ }
				}

				file = await this.app.vault.create(path, '')
			}

			const fileData = await this.app.vault.read(file)
			const dataToWrite = matchedRoute.mode === 'append'
				? fileData + '\n' + replaceVariables(matchedRoute.content, variables)
				: replaceVariables(matchedRoute.content, variables) + '\n' + fileData

			console.debug({ action, input, inputVariables, matchedVariables: matchResult, variables, path, fileData, dataToWrite })

			await this.app.vault.modify(file, dataToWrite);

			if (matchedRoute.leaf) {
				const leaf = this.app.workspace.getLeaf(matchedRoute.leaf);
				await leaf.openFile(file);
			}
		})
	}

	onunload() {}

	async loadSettings() {
		this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: DeclutterMePlugin;

	constructor(app: App, plugin: DeclutterMePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		this.containerEl.empty();
		this.containerEl.createEl('h2', { text: this.plugin.manifest.name });

		new Setting(this.containerEl)
			.setName('Routes')
			.setDesc('In JSON format')
			.addTextArea((textArea) => {
				textArea.inputEl.rows = 20;
				textArea.inputEl.cols = 60;

				return textArea
					.setPlaceholder(JSON.stringify(routesExample, null, 2))
					.setValue(JSON.stringify(this.plugin.settings.routes, null, 2))
					.onChange(async (value) => {
						try {
							this.plugin.settings.routes = routesSchema.parse(JSON.parse(value));
						} catch { /* ignore */ }

						await this.plugin.saveSettings();
					})
			});
	}
}
