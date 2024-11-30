import { z } from 'zod'

export const variableMapSchema = z.record(z.union([z.number(), z.string()]))
export type VariableMap = z.infer<typeof variableMapSchema>

export const variableSchema = z.object({ name: z.string(), value: z.union([z.string(), z.number()]) })
export type Variable = z.infer<typeof variableSchema>

export const routeSchema = z.object({
  template: z.string(),
  path: z.string(),
  content: z.string(),
  section: z.string().optional(),
  mode: z.enum(['appendLineAfterContent', 'prependLineBeforeContent']).optional(),
  leaf: z.enum(['split', 'tab', 'window']).optional(),
  templatePath: z.string().optional(),
})
export const routesSchema = z.array(routeSchema)
export type Route = z.infer<typeof routeSchema>

export type DeclutterMePluginSettings = {
  routes: Route[]
  device: string
  variables: Variable[]
}
export const DEFAULT_SETTINGS: DeclutterMePluginSettings = {
  routes: [],
  device: '',
  variables: [],
}
