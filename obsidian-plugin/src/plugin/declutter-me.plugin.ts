import { normalizePath, Notice, Plugin } from 'obsidian'
import { match, MatchResult } from '../templater/match.js'
import { applyMarkdownModification } from '../markdown/apply-markdown-modification.js'
import { replaceVariables } from '../utils/replace-variables.js'
import { DeclutterMePluginSettings, DEFAULT_SETTINGS, Route, Variable, variablesSchema } from './common.js'
import { DeclutterMePluginSettingTab } from './declutter-me.plugin-setting-tab.js'
import { SpotlightSuggestModal } from './spotlight.suggest-modal.js'
import { processTemplate } from './workarounds/process-template.js'
import { prepareMarkdownForModification } from 'src/markdown/prepare-markdown-for-modification.js'

type ObsidianProtocolHandlerEvent = {
  action: string
  input: string
  [key: string]: string
}

// TODO: multiline note support (truncated + code block)

export class DeclutterMePlugin extends Plugin {
  settings: DeclutterMePluginSettings = DEFAULT_SETTINGS

  async onload() {
    await this.loadSettings()

    this.addSettingTab(new DeclutterMePluginSettingTab(this))
    this.addRibbonIcon('sparkles', 'Declutter Me: Spotlight', () => new SpotlightSuggestModal(this).open())

    this.addCommand({
      id: 'declutter-me-spotlight',
      name: 'Spotlight',
      callback: () => new SpotlightSuggestModal(this).open()
    })

    this.registerObsidianProtocolHandler('declutter-me', async (event) => {
      const { action: _, input, ...inputVariableMap } = event as ObsidianProtocolHandlerEvent
      await this.handleQuery(input, Object.entries(inputVariableMap).map(([name, value]) => ({ name, value })))
    })
  }

  async loadSettings() {
    let variables: Variable[] = []
    try {
      variables = variablesSchema.parse(JSON.parse(this.app.loadLocalStorage('declutter-me:variables') as string))
    } catch { new Notice('Could not load variables') }

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

  // ---

  async handleQuery(input: string, inputVariables: Variable[] = []) {
    const firstMatchingRoute = this.getFirstMatchingRoute(input)
    if (!firstMatchingRoute) {
      new Notice('Could not parse input')
      return
    }

    const { matchedRoute, matchResult } = firstMatchingRoute
    const variables: Variable[] = [
      { name: 'device', value: this.settings.device },
      ...this.settings.variables,
      ...inputVariables,
      ...matchResult.variables,
    ]

    const path = normalizePath(replaceVariables(matchedRoute.path, variables))
    const file = await this.upsertFile(path)
    const fileData = await this.app.vault.read(file)
      || (matchedRoute.templatePath && await this.loadTemplateFileData(matchedRoute.templatePath))
      || ''

    const section = matchedRoute.section ? replaceVariables(matchedRoute.section, variables) : undefined

    const dataToWrite = applyMarkdownModification({
      markdown: prepareMarkdownForModification({ markdown: fileData, section }),
      type: matchedRoute.mode ?? 'appendLineAfterContent',
      content: replaceVariables(matchedRoute.content, variables),
      section,
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

  // ---

  private async upsertFile(path: string) {
    let file = this.app.vault.getFileByPath(path)
    if (!file) {
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
        return processTemplate(templateFileData)
      }
    }

    return undefined
  }
}
