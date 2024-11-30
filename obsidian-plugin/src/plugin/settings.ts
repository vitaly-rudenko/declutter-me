import { z } from 'zod'

export const variablesSchema = z.record(z.union([z.number(), z.string()]))
export const variablesExample: Variables = {
  hello: 'world'
}
export type Variables = z.infer<typeof variablesSchema>

export const routeSchema = z.object({
  template: z.string(),
  path: z.string(),
  content: z.string(),
  mode: z.enum(['appendLineAfterContent', 'prependLineBeforeContent']).optional(),
  leaf: z.enum(['split', 'tab', 'window']).optional(),
  skipProperties: z.boolean().optional(),
  section: z.string().optional(),
  templatePath: z.string().optional(),
})
export const routesSchema = z.array(routeSchema)
export const routesExample: Route[] = [
  {
    template: 'w {note}',
    path: '5 Test/2 Work/Tasks/{date:yyyy} from {device}.md',
    content: '- [ ] {note}',
  },
  {
    template: 'p {note}',
    path: '5 Test/1 Personal/Tasks/{date:yyyy} from {device}.md',
    content: '- [ ] {note}',
    leaf: 'split',
  },
  {
    template: 'JIRA-{id:number} {note}',
    path: '5 Test/2 Work/Tickets/JIRA-{id} from {device}.md',
    content: '- [ ] {note}',
    mode: 'prependLineBeforeContent',
    leaf: 'tab',
  }
]
export type Route = z.infer<typeof routeSchema>

export type DeclutterMePluginSettings = {
  routes: Route[]
  device: string
  variables: Variables
}
export const DEFAULT_SETTINGS: DeclutterMePluginSettings = {
  routes: routesExample,
  device: 'Personal Macbook',
  variables: variablesExample,
}
