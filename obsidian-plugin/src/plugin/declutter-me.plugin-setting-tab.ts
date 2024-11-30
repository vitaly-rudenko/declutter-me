import { Notice, PluginSettingTab, Setting } from 'obsidian'
import { DeclutterMePlugin } from './declutter-me.plugin'
import { DEFAULT_SETTINGS, variablesExample, variablesSchema, routesExample, routesSchema } from './settings'

export class DeclutterMePluginSettingTab extends PluginSettingTab {
  constructor(readonly plugin: DeclutterMePlugin) {
    super(plugin.app, plugin)
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
