import { normalizePath, Notice, Plugin } from 'obsidian'
import { match, MatchResult } from '../templater/match.js'
import { applyMarkdownModification } from '../markdown/apply-markdown-modification.js'
import { replaceVariables } from '../utils/replace-variables.js'
import { transformMatchResultToVariables } from '../templater/transform-match-result-to-variables.js'
import { DeclutterMePluginSettings, DEFAULT_SETTINGS, Route, Variables, variablesSchema } from './settings.js'
import { DeclutterMeSettingTab } from './declutter-me.plugin-setting-tab.js'
import { SpotlightSuggestModal } from './spotlight.suggest-modal.js'

export class DeclutterMePlugin extends Plugin {
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

    this.addSettingTab(new DeclutterMeSettingTab(this.app, this))

    this.addCommand({
      id: 'declutter-me-spotlight',
      name: 'Spotlight',
      callback: () => {
        new SpotlightSuggestModal(this.app, this, async (query) => {
          await this.handleQuery(query, {})
        }).open()
      }
    })

    this.registerObsidianProtocolHandler('declutter-me', async (event) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { action, input, ...inputVariables } = event as { action: string; input: string;[key: string]: string }
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
