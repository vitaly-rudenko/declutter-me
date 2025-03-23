import { processTemplate } from "./process-template"

describe('processTemplate()', () => {
  it('processes a template', () => {
    expect(processTemplate(`\
---
created_at: "{{date}}T{{time}}"
links:
  - "[[Knowledge {{date:YYYY}}]]"
  - "[[Knowledge {{date:YYYY-MM}} ({{date:MMMM}})]]"
tags:
  - knowledge
  - knowledge-{{date:YYYY}}
  - knowledge-{{date:YYYY-MM}}
---
---`, new Date('2023-04-05 16:17:18'))).toBe(`\
---
created_at: "2023-04-05T16:17"
links:
  - "[[Knowledge 2023]]"
  - "[[Knowledge 2023-04 (April)]]"
tags:
  - knowledge
  - knowledge-2023
  - knowledge-2023-04
---
---`)
  })
})