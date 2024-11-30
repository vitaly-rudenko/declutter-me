import { Notice, PluginSettingTab, Setting } from 'obsidian'
import { DeclutterMePlugin } from './declutter-me.plugin'
import { DEFAULT_SETTINGS, variablesSchema, routesSchema } from './settings'

export class DeclutterMePluginSettingTab extends PluginSettingTab {
  constructor(readonly plugin: DeclutterMePlugin) {
    super(plugin.app, plugin)
  }

  display(): void {
    this.containerEl.empty()
    this.containerEl.createEl('h1', { text: this.plugin.manifest.name })

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

    this.containerEl.createEl('h3', { text: 'Variables' })
    this.containerEl.createEl('small', { text: 'Not synced to other devices' })

    for (const [initialVariableName, value] of Object.entries(this.plugin.settings.variables)) {
      let currentVariableName = initialVariableName

      const setting = new Setting(this.containerEl)
        .addText((text) => {
          return text
            .setPlaceholder('Variable name')
            .setValue(currentVariableName)
            .onChange(async (newVariableName) => {
              if (currentVariableName === newVariableName) return
              if (this.plugin.settings.variables[newVariableName]) {
                new Notice('Variable already exists')
                return
              }

              delete this.plugin.settings.variables[currentVariableName]
              this.plugin.settings.variables[newVariableName] = value
              currentVariableName = newVariableName

              await this.plugin.saveSettings()
            })
        })
        .addText((text) => {
          return text
            .setPlaceholder('Value')
            .setValue(String(value))
            .onChange(async (newValue) => {
              if (value === newValue) return

              this.plugin.settings.variables[currentVariableName] = newValue

              await this.plugin.saveSettings()
            })
        })
        .addButton((button) => {
          return button
            .setWarning()
            .setIcon('x')
            .onClick(async () => {
              delete this.plugin.settings.variables[currentVariableName]
              setting.setVisibility(false)

              await this.plugin.saveSettings()
            })
        })
    }

    let newVariableName = ''
    let newVariableValue = ''
    new Setting(this.containerEl)
        .setName('Add new variable')
        .addText((text) => {
          return text
            .setPlaceholder('Variable name')
            .onChange(async (variableName) => {
              newVariableName = variableName
            })
        })
        .addText((text) => {
          return text
            .setPlaceholder('Value')
            .onChange(async (value) => {
              newVariableValue = value
            })
        })
        .addButton((button) => {
          return button
            .setIcon('plus')
            .onClick(async () => {
              if (!newVariableName || !newVariableValue) return
              if (this.plugin.settings.variables[newVariableName]) {
                new Notice('Variable already exists')
                return
              }

              this.plugin.settings.variables[newVariableName] = newVariableValue

              await this.plugin.saveSettings()
              this.display()
            })
        })

    this.containerEl.createEl('h3', { text: 'Routes' })
    this.containerEl.createEl('small', { text: 'Synced to all devices' })

    for (const [index, route] of this.plugin.settings.routes.entries()) {
      this.containerEl.createEl('h2', { text: `Route ${index + 1}` })

      new Setting(this.containerEl)
        .setName('Input')
        .setDesc('Template')
        .addText((text) => {
          return text
            .setPlaceholder('p {note}')
            .setValue(route.template)
        })

      new Setting(this.containerEl)
        .setName('Destination')
        .setDesc('Path and section')
        .addText((text) => {
          return text
            .setPlaceholder('Personal/Tasks/{date:yyyy} from {device}.md')
            .setValue(route.path)
        })
        .addText((text) => {
          return text
            .setPlaceholder('# Section')
            .setValue(route.section ?? '')
        })

      new Setting(this.containerEl)
        .setName('Output')
        .setDesc('Content and template path')
        .addText((text) => {
          return text
            .setPlaceholder('- [ ] {note}')
            .setValue(route.content)
        })
        .addText((text) => {
          return text
            .setPlaceholder('Templates/Personal Task.md')
            .setValue(route.templatePath ?? '')
        })

      new Setting(this.containerEl)
        .setName('Options')
        .setDesc('Mode and leaf')
        .addDropdown((dropdown) => {
          return dropdown
            .addOption('appendLineAfterContent', 'Append line after content')
            .addOption('prependLineBeforeContent', 'Prepend line before content')
            .setValue(route.mode ?? 'appendLineAfterContent')
        })
        .addDropdown((dropdown) => {
          return dropdown
            .addOption('', 'Do not open')
            .addOption('split', 'Open in a Split')
            .addOption('tab', 'Open in new Tab')
            .addOption('window', 'Open in new Window')
            .setValue(route.leaf ?? '')
        })

      new Setting(this.containerEl)
        .setName('Actions')
        .addButton((button) => {
          return button
            .setButtonText('Move up')
        })
        .addButton((button) => {
          return button
            .setButtonText('Move down')
        })
        .addButton((button) => {
          return button
            .setWarning()
            .setButtonText('Delete')
            .onClick(async () => {
              this.plugin.settings.routes.splice(index, 1)
              await this.plugin.saveSettings()
              this.display()
            })
        })
    }

    new Setting(this.containerEl)
      .addButton((button) => {
        return button
          .setButtonText('Add new route')
          .onClick(async () => {
            this.plugin.settings.routes.push({ template: '', path: '', content: '' })
            await this.plugin.saveSettings()
            this.display()
          })
      })

    this.containerEl.createEl('h3', { text: 'Raw settings' })

    let variablesErrorTimeoutId: any
    new Setting(this.containerEl)
      .setName('Variables')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 10
        textArea.inputEl.cols = 60

        return textArea
          .setValue(JSON.stringify(this.plugin.settings.variables, null, 2))
          .onChange(async (value) => {
            try {
              this.plugin.settings.variables = variablesSchema.parse(JSON.parse(value))
            } catch {
              clearTimeout(variablesErrorTimeoutId)
              variablesErrorTimeoutId = setTimeout(() => new Notice('Could not parse variables'), 3000)
            }

            await this.plugin.saveSettings()
          })
      })

    let routesErrorTimeoutId: any
    new Setting(this.containerEl)
      .setName('Routes')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 20
        textArea.inputEl.cols = 60

        return textArea
          .setValue(JSON.stringify(this.plugin.settings.routes, null, 2))
          .onChange(async (value) => {
            try {
              this.plugin.settings.routes = routesSchema.parse(JSON.parse(value))
            } catch {
              clearTimeout(routesErrorTimeoutId)
              routesErrorTimeoutId = setTimeout(() => new Notice('Could not parse routes'), 3000)
            }

            await this.plugin.saveSettings()
          })
      })
  }
}
