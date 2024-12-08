import { Notice, PluginSettingTab, Setting, TextAreaComponent } from 'obsidian'
import { DeclutterMePlugin } from './declutter-me.plugin'
import { DEFAULT_SETTINGS, routesSchema, variablesSchema, RouteLeaf, RouteMode, RouteType } from './common'

export class DeclutterMePluginSettingTab extends PluginSettingTab {
  constructor(readonly plugin: DeclutterMePlugin) {
    super(plugin.app, plugin)
  }

  display(): void {
    this.containerEl.empty()
    this.containerEl.createEl('h1', { text: this.plugin.manifest.name })

    this.containerEl.createEl('h3', { text: 'Variables' })

    new Setting(this.containerEl)
      .setName('{device}')
      .setDesc('Can be used in path, content and section. Not synced to other devices.')
      .addText((text) => {
        return text
          .setPlaceholder(DEFAULT_SETTINGS.device)
          .setValue(this.plugin.settings.device)
          .onChange(async (value) => {
            this.plugin.settings.device = value

            await this.plugin.saveSettings()
          })
      })

    this.containerEl.createEl('h2', { text: 'Custom variables' })

    for (const [index, variable] of this.plugin.settings.variables.entries()) {
      const setting = new Setting(this.containerEl)
        .setName(`{${variable.name}}`)
        .setDesc('Can be used in path, content and section. Not synced to other devices.')
        .addText((text) => {
          return text
            .setPlaceholder('Variable name')
            .setValue(variable.name)
            .onChange(async (newVariableName) => {
              variable.name = newVariableName
              setting.setName(`{${variable.name}}`)

              await this.plugin.saveSettings()
            })
        })
        .addText((text) => {
          return text
            .setPlaceholder('Value')
            .setValue(String(variable.value))
            .onChange(async (newValue) => {
              variable.value = newValue

              await this.plugin.saveSettings()
            })
        })
        .addButton((button) => {
          return button
            .setWarning()
            .setIcon('x')
            .onClick(async () => {
              this.plugin.settings.variables.splice(index, 1)

              await this.plugin.saveSettings()
              this.display()
            })
        })
    }

    new Setting(this.containerEl)
      .addButton((button) => {
        return button
          .setButtonText('Add new custom variable')
          .onClick(async () => {
            this.plugin.settings.variables.push({ name: '', value: '' })

            await this.plugin.saveSettings()
            this.display()
          })
      })

    this.containerEl.createEl('h3', { text: 'Routes' })

    for (const [index, route] of this.plugin.settings.routes.entries()) {
      // this.containerEl.createEl('h2', { text: `Route ${index + 1}` })

      new Setting(this.containerEl)
        .setName(`Route ${index + 1}`)
        .setHeading()
        .addButton((button) => {
          return button
            .setIcon('move-up')
            .setDisabled(index === 0)
            .onClick(async () => {
              if (index === 0) return
              const swapRoute = this.plugin.settings.routes[index - 1]
              this.plugin.settings.routes[index - 1] = route
              this.plugin.settings.routes[index] = swapRoute
              await this.plugin.saveSettings()
              this.display()
            })
        })
        .addButton((button) => {
          return button
            .setIcon('move-down')
            .setDisabled(index === this.plugin.settings.routes.length - 1)
            .onClick(async () => {
              if (index === this.plugin.settings.routes.length - 1) return
              const swapRoute = this.plugin.settings.routes[index + 1]
              this.plugin.settings.routes[index + 1] = route
              this.plugin.settings.routes[index] = swapRoute
              await this.plugin.saveSettings()
              this.display()
            })
        })
        .addButton((button) => {
          return button
            .setWarning()
            .setIcon('x')
            .onClick(async () => {
              this.plugin.settings.routes.splice(index, 1)
              await this.plugin.saveSettings()
              this.display()
            })
        })

      setupSettingSection(new Setting(this.containerEl)
        .setName('Input')
        .addText((text) => {
          return text
            .setPlaceholder('personal {note}')
            .setValue(route.template)
            .onChange(async (newTemplate) => {
              route.template = newTemplate
              await this.plugin.saveSettings()
            })
        }))

      setupSettingSection(new Setting(this.containerEl)
        .setName('Destination\nSection')
        .addText((text) => {
          return text
            .setPlaceholder('Personal/Tasks/{date:yyyy} from {device}.md')
            .setValue(route.path)
            .onChange(async (newPath) => {
              route.path = newPath
              await this.plugin.saveSettings()
            })
        })
        .addText((text) => {
          return text
            .setPlaceholder('# Section')
            .setValue(route.section ?? '')
            .onChange(async (newSection) => {
              route.section = newSection ? newSection : undefined
              await this.plugin.saveSettings()
            })
        }))

      setupSettingSection(new Setting(this.containerEl)
        .setName('Content\nTemplate')
        .addText((text) => {
          return text
            .setPlaceholder('{note}')
            .setValue(route.content ?? '')
            .onChange(async (newContent) => {
              route.content = newContent || undefined
              await this.plugin.saveSettings()
            })
        })
        .addText((text) => {
          return text
            .setPlaceholder('Templates/Personal Task.md')
            .setValue(route.templatePath ?? '')
            .onChange(async (newTemplatePath) => {
              route.templatePath = newTemplatePath || undefined
              await this.plugin.saveSettings()
            })
        }))

      new Setting(this.containerEl)
        .setName('Options')
        .addDropdown((dropdown) => {
          return dropdown
            .addOption('appendLineAfterContent', 'Append line after content')
            .addOption('prependLineBeforeContent', 'Prepend line before content')
            .setValue(route.mode ?? 'appendLineAfterContent')
            .onChange(async (newMode) => {
              route.mode = newMode as RouteMode
              await this.plugin.saveSettings()
            })
        })
        .addDropdown((dropdown) => {
          return dropdown
            .addOption('tab', 'Open in a new Tab')
            .addOption('split', 'Open in a Split')
            .addOption('window', 'Open in a new Window')
            .addOption('noAction', 'No action')
            .setValue(route.leaf ?? 'tab')
            .onChange(async (newLeaf) => {
              route.leaf = newLeaf as RouteLeaf
              await this.plugin.saveSettings()
            })
        })
        .addDropdown((dropdown) => {
          return dropdown
            .addOption('task', 'Task')
            .addOption('raw', 'Raw')
            .setValue(route.type ?? 'task')
            .onChange(async (newType) => {
              route.type = newType as RouteType
              await this.plugin.saveSettings()
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

    let variablesJsonTextArea: TextAreaComponent
    new Setting(this.containerEl)
      .setName('Variables')
      .addTextArea((textArea) => {
        variablesJsonTextArea = textArea
        textArea.inputEl.cols = 60
        textArea.inputEl.rows = 15

        return textArea.setValue(JSON.stringify(this.plugin.settings.variables, null, 2))
      })

    let routesJsonTextArea: TextAreaComponent
    new Setting(this.containerEl)
      .setName('Routes')
      .addTextArea((textArea) => {
        routesJsonTextArea = textArea
        textArea.inputEl.cols = 60
        textArea.inputEl.rows = 15

        return textArea.setValue(JSON.stringify(this.plugin.settings.routes, null, 2))
      })

    new Setting(this.containerEl)
      .addButton((button) => {
        return button
          .setButtonText('Load')
          .onClick(async () => {
            variablesJsonTextArea.setValue(JSON.stringify(this.plugin.settings.variables, null, 2))
            routesJsonTextArea.setValue(JSON.stringify(this.plugin.settings.routes, null, 2))

            await this.plugin.saveSettings()
            this.display()
          })
      })
      .addButton((button) => {
        return button
          .setButtonText('Save')
          .onClick(async () => {
            try {
              this.plugin.settings.variables = variablesSchema.parse(JSON.parse(variablesJsonTextArea.getValue()))
            } catch {
              new Notice('Invalid JSON for variables')
              return
            }

            try {
              this.plugin.settings.routes = routesSchema.parse(JSON.parse(routesJsonTextArea.getValue()))
            } catch {
              new Notice('Invalid JSON for routes')
              return
            }

            await this.plugin.saveSettings()
            this.display()
          })
      })
      .addButton((button) => {
        return button
          .setButtonText('Reset settings')
          .setWarning()
          .onClick(async () => {
            this.plugin.settings.variables = []
            this.plugin.settings.routes = []

            await this.plugin.saveSettings()
            this.display()
          })
      })
  }
}

function setupSettingSection(setting: Setting) {
  setting.infoEl.style.flex = '0 0 auto'
  setting.infoEl.style.minWidth = '25%'
  setting.infoEl.innerHTML = setting.infoEl.innerHTML.replace(/\n/g, '<br>')

  setting.controlEl.style.flexDirection = 'column'
  setting.controlEl.style.alignItems = 'stretch'
}
