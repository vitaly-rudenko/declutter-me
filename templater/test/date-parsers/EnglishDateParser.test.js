import { expect } from 'chai'
import sinon from 'sinon'

import { EnglishDateParser } from '../../index.js'

describe('EnglishDateParser', () => {
  /** @type {EnglishDateParser} */
  let englishDateParser
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2020-05-05 10:00')) // tuesday

    englishDateParser = new EnglishDateParser({
      references: {
        morningHours: 7,
        eveningHours: 18,
        nightHours: 21,
      }
    })
  })

  afterEach(() => {
    clock.restore()
  })

  describe('parse()', () => {
    function testEach(describe, title, inputOutput, options) {
      describe(`[${title}]`, () => {
        for (const [input, output] of inputOutput) {
          if (output) {
            it(`should parse "${input}"`, () => {
              expect(englishDateParser.parse(input, options)).to.deep.eq(new Date(output))
            })
          } else {
            it(`should NOT parse "${input}"`, () => {
              expect(englishDateParser.parse(input, options)).to.be.null
            })
          }
        }
      })
    }

    testEach(describe, 'time of day', [
      ['in the morning', '2020-05-05 7:00'],
      ['at noon',        '2020-05-05 12:00'],
      ['in the evening', '2020-05-05 18:00'],
      ['at night',       '2020-05-05 21:00'],
      ['at midnight',    '2020-05-06 0:00'],
    ])

    testEach(describe, 'days of week', [
      ['on monday',    '2020-05-04 10:00'],
      ['on tuesday',   '2020-05-05 10:00'],
      ['on wednesday', '2020-05-06 10:00'],
      ['on thursday',  '2020-05-07 10:00'],
      ['on friday',    '2020-05-08 10:00'],
      ['on saturday',  '2020-05-09 10:00'],
      ['on sunday',    '2020-05-10 10:00'],
    ])

    testEach(describe, 'relative date', [
      ['5 years ago',          '2015-05-05 10:00'],
      ['a year ago',           '2019-05-05 10:00'],
      ['last year',            '2019-05-05 10:00'],
      ['previous year',        '2019-05-05 10:00'],
      ['2 months ago',         '2020-03-05 10:00'],
      ['a month ago',          '2020-04-05 10:00'],
      ['last month',           '2020-04-05 10:00'],
      ['previous month',       '2020-04-05 10:00'],
      ['3 weeks ago',          '2020-04-14 10:00'],
      ['a week ago',           '2020-04-28 10:00'],
      ['last week',            '2020-04-28 10:00'],
      ['previous week',        '2020-04-28 10:00'],
      ['day before yesterday', '2020-05-03 10:00'],
      ['previous day',         '2020-05-04 10:00'],
      ['a day ago',            '2020-05-04 10:00'],
      ['yesterday',            '2020-05-04 10:00'],
      ['today',                '2020-05-05 10:00'],
      ['tomorrow',             '2020-05-06 10:00'],
      ['next day',             '2020-05-06 10:00'],
      ['day after tomorrow',   '2020-05-07 10:00'],
      ['next week',            '2020-05-12 10:00'],
      ['next month',           '2020-06-05 10:00'],
      ['next year',            '2021-05-05 10:00'],
    ])

    testEach(describe, 'relative time', [
      ['now',           '2020-05-05 10:00'],
      ['in a minute',   '2020-05-05 10:01'],
      ['in 15 minutes', '2020-05-05 10:15'],
      ['in an hour',    '2020-05-05 11:00'],
      ['in 5 hours',    '2020-05-05 15:00'],
      ['in a day',      '2020-05-06 10:00'],
      ['in 2 days',     '2020-05-07 10:00'],
      ['in a week',     '2020-05-12 10:00'],
      ['in 4 weeks',    '2020-06-02 10:00'],
      ['in a month',    '2020-06-05 10:00'],
      ['in 3 months',   '2020-08-05 10:00'],
      ['in a year',     '2021-05-05 10:00'],
      ['in 5 years',    '2025-05-05 10:00'],
    ])

    describe('[complex]', () => {
      testEach(describe, 'days of week + time of day', [
        ['on monday morning',        '2020-05-04 07:00'],
        ['on tuesday evening',       '2020-05-05 18:00'],
        ['on wednesday at midnight', '2020-05-07 0:00'],
        ['on thursday at noon',      '2020-05-07 12:00'],
        ['on friday morning',        '2020-05-08 07:00'],
        ['on saturday evening',      '2020-05-09 18:00'],
        ['on sunday night',          '2020-05-10 21:00'],
      ])
    })

    describe('[forwardOnly]', () => {
      const options = { forwardOnly: true }

      testEach(describe, 'time of day', [
        ['in the morning', '2020-05-06 7:00'],
        ['at noon',        '2020-05-05 12:00'],
        ['in the evening', '2020-05-05 18:00'],
        ['at midnight',    '2020-05-06 0:00'],
      ], options)
  
      testEach(describe, 'days of week', [
        ['on monday',    '2020-05-11 10:00'],
        ['on tuesday',   '2020-05-05 10:00'],
        ['on wednesday', '2020-05-06 10:00'],
        ['on thursday',  '2020-05-07 10:00'],
        ['on friday',    '2020-05-08 10:00'],
        ['on saturday',  '2020-05-09 10:00'],
        ['on sunday',    '2020-05-10 10:00'],
      ], options)

      testEach(describe, 'relative date', [
        ['5 years ago',          null],
        ['a year ago',           null],
        ['last year',            null],
        ['previous year',        null],
        ['2 months ago',         null],
        ['a month ago',          null],
        ['last month',           null],
        ['previous month',       null],
        ['3 weeks ago',          null],
        ['a week ago',           null],
        ['last week',            null],
        ['previous week',        null],
        ['day before yesterday', null],
        ['previous day',         null],
        ['a day ago',            null],
        ['yesterday',            null],
        ['today',                '2020-05-05 10:00'],
        ['tomorrow',             '2020-05-06 10:00'],
        ['next day',             '2020-05-06 10:00'],
        ['day after tomorrow',   '2020-05-07 10:00'],
        ['next week',            '2020-05-12 10:00'],
        ['next month',           '2020-06-05 10:00'],
        ['next year',            '2021-05-05 10:00'],
      ], options)

      describe('[complex]', () => {
        testEach(describe, 'days of week + time of day', [
          ['on monday night',          '2020-05-11 21:00'],
          ['on tuesday morning',       '2020-05-12 07:00'],
          ['on wednesday at midnight', '2020-05-07 0:00'],
          ['on thursday at noon',      '2020-05-07 12:00'],
          ['on friday morning',        '2020-05-08 07:00'],
          ['on saturday evening',      '2020-05-09 18:00'],
          ['on sunday night',          '2020-05-10 21:00'],
        ], options)
      })
    })
  })
})
