import { App, normalizePath, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface Pattern {
	pattern: string;
	path: string;
	template?: string;
	content?: string;
	header?: string;
}

interface DeclutterMePluginSettings {
	patterns: Pattern[];
}

const DEFAULT_SETTINGS: DeclutterMePluginSettings = {
	patterns: [],
}

const patternsExample = {
	patterns: [
		{
			pattern: "w {note}",
			path: "Work/Tasks/{date:YYYY} from {device}",
			content: "- [ ] {note}"
		},
		{
			pattern: "p {note}",
			template: "Templates/Personal Task",
			path: "Personal/Tasks/{date:YYYY} from {device}",
			content: "- [ ] {note} #{date:YYYY-MM-DD}",
			header: "# Backlog ({date:MMMM})"
		}
	]
};

export default class DeclutterMePlugin extends Plugin {
	settings: DeclutterMePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerObsidianProtocolHandler('declutter-me', async (event) => {
			const { action, input, ...variables } = event as { action: string; input: string; [key: string]: string };
			console.log({ action, input }, variables)

			let path = normalizePath('1 Personal/Test/2024 from Personal Macbook')
			if (!path.endsWith('.md')) {
				path = path + '.md'
			}

			let file = this.app.vault.getFileByPath(path)
			if (!file) {
				if (path.includes('/')) {
					await this.app.vault.createFolder(path.split('/').slice(0, -1).join('/'))
				}

				file = await this.app.vault.create(path, '')
			}

			const fileData = await this.app.vault.read(file)
			const dataToWrite = fileData + '\n' + '- [ ] ' + input

			await this.app.vault.modify(file, dataToWrite);
		})
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
			.setName('Patterns')
			.setDesc('In JSON format')
			.addTextArea((textArea) => {
				textArea.inputEl.rows = 20;
				textArea.inputEl.cols = 40;

				return textArea
					.setPlaceholder(JSON.stringify(patternsExample, null, 2))
					.setValue(JSON.stringify(this.plugin.settings.patterns))
					.onChange(async (value) => {
						try {
							this.plugin.settings.patterns = JSON.parse(value);
						} catch { /* ignore */ }

						await this.plugin.saveSettings();
					})
			});
	}
}
