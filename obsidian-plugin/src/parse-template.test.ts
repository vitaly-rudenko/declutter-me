import { parseTemplate } from './parse-template.js'
import { stripIndent } from 'common-tags'

describe('parseTemplate()', () => {
  it('should parse simple text', () => {
    expect(parseTemplate('Hello'))
      .toEqual([
        { type: 'text', value: 'Hello' },
      ]);

    expect(parseTemplate('Buy chicken'))
      .toEqual([
        { type: 'text', value: 'Buy chicken' },
      ]);
  });

  it('should parse variables', () => {
    expect(parseTemplate('{note}'))
      .toEqual([
        { type: 'variable', value: 'note', input: { type: 'text' } },
      ]);

    expect(parseTemplate('{tag}{note}'))
      .toEqual([
        { type: 'variable', value: 'tag', input: { type: 'text' } },
        { type: 'variable', value: 'note', input: { type: 'text' } },
      ]);

    expect(parseTemplate('{tag} {note}'))
      .toEqual([
        { type: 'variable', value: 'tag', input: { type: 'text' } },
        { type: 'text', value: ' ' },
        { type: 'variable', value: 'note', input: { type: 'text' } },
      ]);

    expect(parseTemplate('Buy {note}, please'))
      .toEqual([
        { type: 'text', value: 'Buy ' },
        { type: 'variable', value: 'note', input: { type: 'text' } },
        { type: 'text', value: ', please' },
      ]);

    expect(parseTemplate('#{tag} Buy {note}, please'))
      .toEqual([
        { type: 'text', value: '#' },
        { type: 'variable', value: 'tag', input: { type: 'text' } },
        { type: 'text', value: ' Buy ' },
        { type: 'variable', value: 'note', input: { type: 'text' } },
        { type: 'text', value: ', please' },
      ]);
  });

  it('should parse optionals', () => {
    expect(parseTemplate('[hello]'))
      .toEqual([
        { type: 'optional', value: [{ type: 'text', value: 'hello' }] }
      ]);

    expect(parseTemplate('[hello][world]'))
      .toEqual([
        { type: 'optional', value: [{ type: 'text', value: 'hello' }] },
        { type: 'optional', value: [{ type: 'text', value: 'world' }] }
      ]);

    expect(parseTemplate('[hello] [world]'))
      .toEqual([
        { type: 'optional', value: [{ type: 'text', value: 'hello' }] },
        { type: 'text', value: ' ' },
        { type: 'optional', value: [{ type: 'text', value: 'world' }] }
      ]);
  });

  it('should parse variations', () => {
    expect(parseTemplate('(hello)'))
      .toEqual([
        {
          type: 'variational',
          value: [
            [{ type: 'text', value: 'hello' }],
          ]
        }
      ]);

    expect(parseTemplate('(hello|hi)'))
      .toEqual([
        {
          type: 'variational',
          value: [
            [{ type: 'text', value: 'hello' }],
            [{ type: 'text', value: 'hi' }],
          ]
        }
      ]);

    expect(parseTemplate('(hello|hi)(world|there)'))
      .toEqual([
        {
          type: 'variational',
          value: [
            [{ type: 'text', value: 'hello' }],
            [{ type: 'text', value: 'hi' }],
          ]
        },
        {
          type: 'variational',
          value: [
            [{ type: 'text', value: 'world' }],
            [{ type: 'text', value: 'there' }],
          ]
        }
      ]);

    expect(parseTemplate('(hello|hi|hey) (world|there)'))
      .toEqual([
        {
          type: 'variational',
          value: [
            [{ type: 'text', value: 'hello' }],
            [{ type: 'text', value: 'hi' }],
            [{ type: 'text', value: 'hey' }],
          ]
        },
        { type: 'text', value: ' ' },
        {
          type: 'variational',
          value: [
            [{ type: 'text', value: 'world' }],
            [{ type: 'text', value: 'there' }],
          ]
        }
      ]);
  });

  it('should build pattern from the input string (complex)', () => {
    expect(parseTemplate('(Buy|Purchase) {body}[,] please[ #{tag}][(!|.)]'))
      .toEqual([
        {
          type: 'variational',
          value: [
            [{ type: 'text', value: 'Buy' }],
            [{ type: 'text', value: 'Purchase' }],
          ]
        },
        { type: 'text', value: ' ' },
        { type: 'variable', value: 'body', input: { type: 'text' } },
        {
          type: 'optional',
          value: [{ type: 'text', value: ',' }]
        },
        { type: 'text', value: ' please' },
        {
          type: 'optional',
          value: [
            { type: 'text', value: ' #' },
            { type: 'variable', value: 'tag', input: { type: 'text' } }
          ]
        },
        {
          type: 'optional',
          value: [{
            type: 'variational',
            value: [
              [{ type: 'text', value: '!' }],
              [{ type: 'text', value: '.' }]
            ]
          }]
        },
      ]);
  });

  it('should parse nested cases', () => {
    expect(parseTemplate('[[{tag}]]'))
      .toEqual([{
        type: 'optional',
        value: [{
          type: 'optional',
          value: [{
            type: 'variable',
            value: 'tag',
            input: { type: 'text' }
          }]
        }]
      }]);

    expect(parseTemplate('(([[hello]]))'))
      .toEqual([{
        type: 'variational',
        value: [
          [{
            type: 'variational',
            value: [
              [{
                type: 'optional',
                value: [{
                  type: 'optional',
                  value: [{
                    type: 'text',
                    value: 'hello'
                  }]
                }]
              }]
            ]
          }]
        ]
      }]);
  });

  it('should parse input types', () => {
    expect(parseTemplate('#{hashtag} buy {Note:text}, please[ {when:number}][ #{My Tag:word}]'))
      .toEqual([
        { type: 'text', value: '#' },
        { type: 'variable', value: 'hashtag', input: { type: 'text' } },
        { type: 'text', value: ' buy ' },
        { type: 'variable', value: 'Note', input: { type: 'text' } },
        { type: 'text', value: ', please' },
        {
          type: 'optional',
          value: [
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'when', input: { type: 'number' } },
          ]
        },
        {
          type: 'optional',
          value: [
            { type: 'text', value: ' #' },
            { type: 'variable', value: 'My Tag', input: { type: 'word' } },
          ]
        },
      ]);
  });

  it('should build multiline patterns properly', () => {
    expect(parseTemplate(stripIndent`
      Contact: {Name:word}[ {Surname:word}][
      Phone: {Phone:phone}]
      Email: {Email:email}
    `)).toEqual([
      { type: 'text', value: 'Contact: ' },
      { type: 'variable', value: 'Name', input: { type: 'word' } },
      {
        type: 'optional',
        value: [
          { type: 'text', value: ' ' },
          { type: 'variable', value: 'Surname', input: { type: 'word' } },
        ]
      },
      {
        type: 'optional',
        value: [
          { type: 'text', value: '\nPhone: ' },
          { type: 'variable', value: 'Phone', input: { type: 'phone' } },
        ]
      },
      { type: 'text', value: '\nEmail: ' },
      { type: 'variable', value: 'Email', input: { type: 'email' } },
    ]);

    expect(parseTemplate(stripIndent`
      Hello( world|
      world)
    `)).toEqual([
      { type: 'text', value: 'Hello' },
      {
        type: 'variational',
        value: [
          [{ type: 'text', value: ' world' }],
          [{ type: 'text', value: '\nworld' }],
        ]
      },
    ]);
  });

  it('should build patterns for complex nested variational and optional tokens', () => {
    expect(parseTemplate('(кг|кило[грам[(а|ов)]])')).toEqual([
      {
        type: 'variational',
        value: [
          [{ type: 'text', value: 'кг' }],
          [
            { type: 'text', value: 'кило' },
            {
              type: 'optional',
              value: [
                { type: 'text', value: 'грам' },
                {
                  type: 'optional',
                  value: [
                    {
                      type: 'variational',
                      value: [
                        [{ type: 'text', value: 'а' }],
                        [{ type: 'text', value: 'ов' }],
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        ]
      }
    ]);
  });

  it('should build patterns for custom input types', () => {
    expect(parseTemplate('{Unit:(kg|g|pcs)}')).toEqual([
      {
        type: 'variable',
        value: 'Unit',
        input: {
          type: 'match',
          match: [
            {
              type: 'variational',
              value: [
                [{ type: 'text', value: 'kg' }],
                [{ type: 'text', value: 'g' }],
                [{ type: 'text', value: 'pcs' }],
              ]
            }
          ]
        }
      }
    ]);

    expect(parseTemplate('{Amount:{AmountNumber:number} kg}')).toEqual([
      {
        type: 'variable',
        value: 'Amount',
        input: {
          type: 'match',
          match: [
            { type: 'variable', value: 'AmountNumber', input: { type: 'number' } },
            { type: 'text', value: ' kg' },
          ]
        }
      }
    ]);
  });
});
