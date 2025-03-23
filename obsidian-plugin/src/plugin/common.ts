import { z } from 'zod'

export const variableSchema = z.object({ name: z.string(), value: z.union([z.string(), z.number()]) })
export const variablesSchema = z.array(variableSchema)
export type Variable = z.infer<typeof variableSchema>

const routeTypeSchema = z.enum(['raw', 'task', 'list-item'])
export type RouteType = z.infer<typeof routeTypeSchema>

const routeModeSchema = z.enum(['appendLineAfterContent', 'prependLineBeforeContent'])
export type RouteMode = z.infer<typeof routeModeSchema>

const routeLeafSchema = z.enum(['noAction', 'split', 'tab', 'window'])
export type RouteLeaf = z.infer<typeof routeLeafSchema>

export const routeSchema = z.object({
  template: z.string(),
  path: z.string(),
  content: z.string().optional(),
  type: routeTypeSchema.optional(),
  section: z.string().optional(),
  mode: routeModeSchema.optional(),
  leaf: routeLeafSchema.optional(),
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
