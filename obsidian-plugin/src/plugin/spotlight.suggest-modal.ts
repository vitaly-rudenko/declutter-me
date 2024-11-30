import { App, SuggestModal } from 'obsidian'
import { match } from '../templater/match.js'
import { replaceVariables } from '../utils/replace-variables.js'
import { transformMatchResultToVariables } from '../templater/transform-match-result-to-variables.js'
import { DeclutterMePlugin } from './declutter-me.plugin.js'
import { Route, Variables } from './settings.js'

export class SpotlightSuggestModal extends SuggestModal<Route> {
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