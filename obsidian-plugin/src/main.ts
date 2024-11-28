import { App, normalizePath, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { z } from 'zod';
import { match } from './match.js';

const DEFAULT_SETTINGS: DeclutterMePluginSettings = {
	routes: [],
}

const routeSchema = z.object({
	template: z.string(),
	path: z.string(),
	content: z.string(),
})

type Route = z.infer<typeof routeSchema>

type DeclutterMePluginSettings = {
	routes: Route[];
}

const routesSchema = z.array(routeSchema)

// TODO: vault
// TODO: append/prepend modes
// TODO: section
// TODO: fileTemplate
// TODO: open file after modifying?

const routesExample: Route[] = [
	{
		template: "w {note}",
		path: "5 Test/2 Work/Tasks/{date:YYYY} from {device}.md",
		content: "\n- [ ] {note}",
	},
	{
		template: "p {note}",
		path: "5 Test/1 Personal/Tasks/{date:YYYY} from {device}.md",
		content: "\n- [ ] {note}",
	},
	{
		template: "JIRA-{id:number} {note}",
		path: "5 Test/2 Work/Tickets/JIRA-{id} from {device}.md",
		content: "\n- [ ] {note}",
	}
];

export default class DeclutterMePlugin extends Plugin {
	settings: DeclutterMePluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerObsidianProtocolHandler('declutter-me', async (event) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { action, input, ...inputVariables } = event as { action: string; input: string; [key: string]: string };

			const matchedRoute = this.settings.routes.find((route) => match(input, route.template))
			if (!matchedRoute) return // TODO: warning
			const matchedVariables = match(input, matchedRoute.template)
			if (!matchedVariables) return // TODO: warning

			const variables = { ...inputVariables, ...matchedVariables }

			function replaceVariables(input: string, variables: Record<string, string | number>) {
				let result = input
				for (const [name, value] of Object.entries(variables)) {
					const variableName = '{' + name + '}'
					while (result.includes(variableName)) {
						result = result.replace(variableName, String(value))
					}
				}
				// TODO: format date
				return result.replace('{date:YYYY}', String(new Date().getFullYear()))
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
			const dataToWrite = fileData + replaceVariables(matchedRoute.content, variables)

			console.debug({ action, input, inputVariables, matchedVariables, variables, path, fileData, dataToWrite })

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
