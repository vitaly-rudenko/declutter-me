import { App, normalizePath, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { RouteBuilder } from '@vitalyrudenko/templater'
import { z } from 'zod';
import { isMatching, match } from 'match';

const DEFAULT_SETTINGS: DeclutterMePluginSettings = {
	routes: [],
}

const routeSchema = z.object({
	pattern: z.string(),
	path: z.string(),
	content: z.string(),
	// section: z.string().optional(),
	// template: z.string().optional(),
})

type Route = z.infer<typeof routeSchema>

type DeclutterMePluginSettings = {
	routes: Route[];
}

const routesSchema = z.array(routeSchema)

const routesExample: Route[] = [
	{
		pattern: "w {note:text}",
		path: "Work/Tasks/{date:YYYY} from {device}",
		content: "- [ ] {note}"
	},
	{
		pattern: "p {note:text}",
		// template: "Templates/Personal Task",
		path: "Personal/Tasks/{date:YYYY} from {device}",
		content: "- [ ] {note}",
		// section: "# Backlog ({date:MMMM})"
	}
];

export default class DeclutterMePlugin extends Plugin {
	settings: DeclutterMePluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerObsidianProtocolHandler('declutter-me', async (event) => {
			const { action, input, ...inputVariables } = event as { action: string; input: string; [key: string]: string };
			console.log({ action, input }, inputVariables)

			const matchedRoute = this.settings.routes.find((route) => isMatching(input, route.pattern))
			if (!matchedRoute) return // TODO: warning
			const matchResult = match(input, matchedRoute.pattern)
			if (!matchResult) return // TODO: warning

			console.log('match:', matchedRoute, matchResult)

			const matchedVariables = matchResult.fields.reduce<Record<string, string>>((acc, curr) => {
				if (!curr.name) return acc
				acc[curr.name] = Array.isArray(curr.value) ? curr.value.join(', ') : curr.value
				return acc
			}, {})

			const variables = { ...inputVariables, ...matchedVariables }

			console.log('variables:', variables)

			function replaceVariables(input: string, variables: Record<string, string>) {
				let result = input
				for (const [name, value] of Object.entries(variables)) {
					const variableName = '{' + name + '}'
					while (result.includes(variableName)) {
						result = result.replace(variableName, value)
					}
				}
				// TODO: format date
				return result.replace('{date:YYYY}', String(new Date().getFullYear()))
			}

			let path = normalizePath(replaceVariables(matchedRoute.path, variables))
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
			const dataToWrite = fileData + replaceVariables(matchedRoute.content, variables)

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
				textArea.inputEl.cols = 40;

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
