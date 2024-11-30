import { App, normalizePath, Notice, Plugin, PluginSettingTab, Setting, SuggestModal } from 'obsidian'
import { z } from 'zod'
import { match, MatchResult } from './templater/match.js'
import { applyMarkdownModification } from './markdown/apply-markdown-modification.js'
import { replaceVariables } from './utils/replace-variables.js'
import { transformMatchResultToVariables } from './templater/transform-match-result-to-variables.js'

const routeSchema = z.object({
  template: z.string(),
  path: z.string(),
  content: z.string(),
  mode: z.enum(['appendLineAfterContent', 'prependLineBeforeContent']).optional(),
  leaf: z.enum(['split', 'tab', 'window']).optional(),
  skipProperties: z.boolean().optional(),
  section: z.string().optional(),
  templatePath: z.string().optional(),
})

const variablesSchema = z.record(z.union([z.number(), z.string()]))

type Variables = z.infer<typeof variablesSchema>
type Route = z.infer<typeof routeSchema>

type DeclutterMePluginSettings = {
  routes: Route[]
  device: string
  variables: Variables
}

const routesSchema = z.array(routeSchema)

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

const variablesExample: Variables = {
  hello: 'world'
}

const DEFAULT_SETTINGS: DeclutterMePluginSettings = {
  routes: routesExample,
  device: 'Personal Macbook',
  variables: variablesExample,
}

export class ExampleModal extends SuggestModal<Route> {
  private latestQuery: string | undefined

  constructor(app: App, private readonly plugin: DeclutterMePlugin, private readonly onTrigger: (query: string) => void) {
    super(app)
  }

  getSuggestions(query: string): Route[] {
    this.latestQuery = query
    const firstMatchingRoute = this.plugin.getFirstMatchingRoute(query)
    return firstMatchingRoute ? [firstMatchingRoute.matchedRoute] : this.plugin.settings.routes
  }

  renderSuggestion(route: Route, el: HTMLElement) {
    const matchResult = this.latestQuery ? match(this.latestQuery, route.template) : undefined
    const variables: Variables = {
      device: this.plugin.settings.device,
      ...this.plugin.settings.variables,
      ...matchResult ? transformMatchResultToVariables(matchResult) : {},
    }

    if (!matchResult) {
      el.createEl('div', { text: route.template })
      el.createEl('small', { text: replaceVariables(route.path, variables) })
      return
    }

    el.createEl('div', { text: replaceVariables(route.content, variables) })
    el.createEl('small', { text: replaceVariables(route.path, variables) })
  }

  onChooseSuggestion() {
    if (!this.latestQuery) return
    this.onTrigger(this.latestQuery)
  }
}

export default class DeclutterMePlugin extends Plugin {
  settings: DeclutterMePluginSettings = DEFAULT_SETTINGS

  async handleQuery(input: string, inputVariables: Variables) {
    const firstMatchingRoute = this.getFirstMatchingRoute(input)
    if (!firstMatchingRoute) {
      new Notice('Could not parse input')
      return
    }

    const { matchedRoute, matchResult } = firstMatchingRoute
    const variables: Variables = {
      device: this.settings.device,
      ...this.settings.variables,
      ...inputVariables,
      ...transformMatchResultToVariables(matchResult),
    }

    const path = normalizePath(replaceVariables(matchedRoute.path, variables))
    const file = await this.upsertFile(path)
    const fileData = await this.app.vault.read(file)
      || (matchedRoute.templatePath && await this.loadTemplateFileData(matchedRoute.templatePath))
      || ''

    const dataToWrite = applyMarkdownModification({
      markdown: fileData,
      type: matchedRoute.mode ?? 'appendLineAfterContent',
      content: replaceVariables(matchedRoute.content, variables),
      skipProperties: matchedRoute.skipProperties ?? false,
      section: matchedRoute.section,
    })

    console.debug({ input, variables, path, dataToWrite })

    await this.app.vault.modify(file, dataToWrite)

    if (matchedRoute.leaf) {
      // TODO: do not open leaf if already opened & visible in any group / split
      //       currently it only checks the currently active file
      // TODO: activate existing leaf if already opened but not visible
      if (this.app.workspace.getActiveFile()?.path !== file.path) {
        const leaf = this.app.workspace.getLeaf(matchedRoute.leaf)
        await leaf.openFile(file)
      }
    }

    new Notice(`Note saved\n${path.split('/').at(-1)?.replace(/\.md$/, '')}`)
  }

  getFirstMatchingRoute(input: string) {
    let matchedRoute: Route | undefined
    let matchResult: MatchResult | undefined
    for (const route of this.settings.routes) {
      matchedRoute = route
      matchResult = match(input, route.template)
      if (matchResult) break
    }

    return matchedRoute && matchResult
      ? { matchedRoute, matchResult }
      : undefined
  }

  private async upsertFile(path: string) {
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
    return file
  }

  private async loadTemplateFileData(templatePath: string) {
    const templateFile = this.app.vault.getFileByPath(templatePath)
    if (templateFile) {
      const templateFileData = await this.app.vault.read(templateFile)
      if (templateFileData !== '') {
        return templateFileData
      }
    }
    return undefined
  }

  async onload() {
    await this.loadSettings()

    this.addSettingTab(new SampleSettingTab(this.app, this))

    this.addCommand({
      id: 'declutter-me-spotlight',
      name: 'Spotlight',
      callback: () => {
        new ExampleModal(this.app, this, async (query) => {
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

  onunload() { }

  async loadSettings() {
    let variables: Variables = {}
    try {
      variables = variablesSchema.parse(JSON.parse(this.app.loadLocalStorage('declutter-me:variables') as string))
    } catch {
      new Notice('Could not load variables')
    }

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...await this.loadData(),
      device: String(this.app.loadLocalStorage('declutter-me:device') || ''),
      variables,
    }
  }

  async saveSettings() {
    await this.saveData(this.settings)
    await this.app.saveLocalStorage('declutter-me:device', this.settings.device)
    await this.app.saveLocalStorage('declutter-me:variables', JSON.stringify(this.settings.variables))
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
      .setName('Device name')
      .setDesc('Can be used as {device} in paths and contents. Not synced to other devices.')
      .addText((text) => {
        return text
          .setPlaceholder(DEFAULT_SETTINGS.device)
          .setValue(this.plugin.settings.device)
          .onChange(async (value) => {
            this.plugin.settings.device = value

            await this.plugin.saveSettings()
          })
      })

    new Setting(this.containerEl)
      .setName('Variables')
      .setDesc('In JSON format. Can be used as {variable} in paths and contents. Not synced to other devices.')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 10
        textArea.inputEl.cols = 60

        return textArea
          .setPlaceholder(JSON.stringify(variablesExample, null, 2))
          .setValue(JSON.stringify(this.plugin.settings.variables, null, 2))
          .onChange(async (value) => {
            try {
              this.plugin.settings.variables = variablesSchema.parse(JSON.parse(value))
            } catch {
              new Notice('Could not parse variables')
            }

            await this.plugin.saveSettings()
          })
      })

    new Setting(this.containerEl)
      .setName('Routes')
      .setDesc('In JSON format. Synced to all devices.')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 20
        textArea.inputEl.cols = 60

        return textArea
          .setPlaceholder(JSON.stringify(routesExample, null, 2))
          .setValue(JSON.stringify(this.plugin.settings.routes, null, 2))
          .onChange(async (value) => {
            try {
              this.plugin.settings.routes = routesSchema.parse(JSON.parse(value))
            } catch {
              new Notice('Could not parse routes')
            }

            await this.plugin.saveSettings()
          })
      })

    new Setting(this.containerEl)
      .setName('Danger zone')
      .addButton((button) => {
        return button
          .setButtonText('Reset routes')
          .setWarning()
          .onClick(async () => {
            this.plugin.settings.routes = [...routesExample]

            await this.plugin.saveSettings()
            this.display()

            new Notice('Routes have been reset')
          })
      })
  }
}
