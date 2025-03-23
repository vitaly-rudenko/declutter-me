import { SuggestModal } from 'obsidian'
import { match } from '../templater/match.js'
import { replaceVariables } from '../utils/replace-variables.js'
import { DeclutterMePlugin } from './declutter-me.plugin.js'
import { Route, Variable } from './common.js'

export class SpotlightSuggestModal extends SuggestModal<Route> {
  private latestQuery: string | undefined

  constructor(private readonly plugin: DeclutterMePlugin) {
    super(plugin.app)
  }

  getSuggestions(query: string): Route[] {
    this.latestQuery = query
    const firstMatchingRoute = this.plugin.getFirstMatchingRoute(query)
    return firstMatchingRoute ? [firstMatchingRoute.matchedRoute] : this.plugin.settings.routes
  }

  renderSuggestion(route: Route, el: HTMLElement) {
    const matchResult = this.latestQuery ? match(this.latestQuery, route.template) : undefined
    const variables: Variable[] = [
      { name: 'device', value: this.plugin.settings.device },
      ...this.plugin.settings.variables,
      ...matchResult?.variables ?? [],
    ]

    if (!matchResult) {
      el.createEl('div', { text: route.template })
      el.createEl('small', { text: replaceVariables(route.path, variables) })
      return
    }

    el.createEl('div', { text: replaceVariables(route.content ?? '{note}', variables) })
    el.createEl('small', { text: replaceVariables(route.path, variables) })
  }

  onChooseSuggestion() {
    if (!this.latestQuery) return
    this.plugin.handleQuery(this.latestQuery)
  }
}