import { applyMarkdownModification } from './apply-markdown-modification'

describe('applyMarkdownModification()', () => {
    describe('type: appendLineAfterContent', () => {
        function testBasic(options: Omit<Parameters<typeof applyMarkdownModification>[0], 'markdown' | 'content'>) {
            expect(applyMarkdownModification({
                ...options,
                markdown: '',
                content: 'test'
            })).toBe('test')

            expect(applyMarkdownModification({
                ...options,
                markdown: 'hello world',
                content: 'test',
            })).toBe('hello world\ntest')

            expect(applyMarkdownModification({
                ...options,
                markdown: '\n\n\nhello world\n\n\n',
                content: 'test',
            })).toBe('\n\n\nhello world\ntest\n\n\n')

            expect(applyMarkdownModification({
                ...options,
                markdown: '\n\n\nhello world\n\n\nhello world\nhi there\n\n\n',
                content: 'multiline\ntest',
            })).toBe('\n\n\nhello world\n\n\nhello world\nhi there\nmultiline\ntest\n\n\n')

            expect(applyMarkdownModification({
                ...options,
                markdown: '---\nhello: world\n---',
                content: 'test',
            })).toBe('---\nhello: world\n---\ntest')

            expect(applyMarkdownModification({
                ...options,
                markdown: '---\nhello: world\n---\nhello world',
                content: 'test',
            })).toBe('---\nhello: world\n---\nhello world\ntest')

            expect(applyMarkdownModification({
                ...options,
                markdown: '---\nhello: world\n---\n\n---\n\nhello world\n\n\n',
                content: 'test',
            })).toBe('---\nhello: world\n---\n\n---\n\nhello world\ntest\n\n\n')
        }

        it('defaults', () => {
            testBasic({ type: 'appendLineAfterContent' })
        })

        it('section: "# section"', () => {
            const options = {
                type: 'appendLineAfterContent',
                section: '# section',
                content: 'test',
            } as const

            expect(applyMarkdownModification({
                markdown: '',
                ...options,
            })).toBe('# section\n\ntest')

            expect(applyMarkdownModification({
                markdown: '# section\n\nhello world',
                ...options,
            })).toBe('# section\n\nhello world\ntest')

            expect(applyMarkdownModification({
                markdown: '# section before\n# section\n#section after\n',
                ...options,
            })).toBe('# section before\n# section\ntest\n#section after\n')
        })
    })

    describe('type: prependLineBeforeContent', () => {
        function testBasic(options: Omit<Parameters<typeof applyMarkdownModification>[0], 'markdown' | 'content'>) {
            expect(applyMarkdownModification({
                ...options,
                markdown: '',
                content: 'test'
            })).toBe('test')

            expect(applyMarkdownModification({
                ...options,
                markdown: 'hello world',
                content: 'test',
            })).toBe('test\nhello world')

            expect(applyMarkdownModification({
                ...options,
                markdown: '\n\n\nhello world\n\n\n',
                content: 'test',
            })).toBe('\n\n\ntest\nhello world\n\n\n')

            expect(applyMarkdownModification({
                ...options,
                markdown: '\n\n\nhello world\n\n\nhello world\nhi there\n\n\n',
                content: 'multiline\ntest',
            })).toBe('\n\n\nmultiline\ntest\nhello world\n\n\nhello world\nhi there\n\n\n')

            expect(applyMarkdownModification({
                ...options,
                markdown: '---\nhello: world\n---',
                content: 'test',
            })).toBe('---\nhello: world\n---\ntest')

            expect(applyMarkdownModification({
                ...options,
                markdown: '---\nhello: world\n---\nhello world',
                content: 'test',
            })).toBe('---\nhello: world\n---\ntest\nhello world')

            expect(applyMarkdownModification({
                ...options,
                markdown: '---\nhello: world\n---\n\n---\n\nhello world\n\n\n',
                content: 'test',
            })).toBe('---\nhello: world\n---\n\ntest\n---\n\nhello world\n\n\n')
        }

        it('defaults', () => {
            testBasic({ type: 'prependLineBeforeContent' })
        })

        it('section: "# section"', () => {
            const options = {
                type: 'prependLineBeforeContent',
                section: '# section',
                content: 'test',
            } as const

            expect(applyMarkdownModification({
                ...options,
                markdown: '',
            })).toBe('# section\n\ntest')

            expect(applyMarkdownModification({
                ...options,
                markdown: '# section\n\nhello world',
            })).toBe('# section\n\ntest\nhello world')

            expect(applyMarkdownModification({
                ...options,
                markdown: '# section before\n# section\n#section after\n',
            })).toBe('# section before\n# section\ntest\n#section after\n')
        })
    })

    describe('[regressions]', () => {
        it('should add section correctly', () => {
            expect(applyMarkdownModification({
                type: 'appendLineAfterContent',
                section: '# section',
                markdown: '---\nhello: world\n---\n---\n',
                content: 'test'
            })).toBe('---\nhello: world\n---\n---\n# section\ntest')
        })
    })
})
