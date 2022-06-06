import { expect } from 'chai'
import sinon from 'sinon'

import { EnglishDateParser } from '../../index.js'

describe('EnglishDateParser', () => {
  /** @type {EnglishDateParser} */
  let englishDateParser
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2020-05-05 10:20')) // tuesday

    englishDateParser = new EnglishDateParser({
      references: {
        startOfDay: 5,
        morning: 7,
        evening: 18,
        night: 21,
      }
    })
  })

  afterEach(() => {
    clock.restore()
  })

  describe('parse()', () => {
    function testEach(describe, title, inputOutput) {
      describe(`[${title}]`, () => {
        for (const [input, regularOutput, forwardOnlyOutput] of inputOutput) {
          if (regularOutput) {
            it(`should parse "${input}"`, () => {
              expect(englishDateParser.parse(input)).to.deep.eq(new Date(regularOutput))
            })

            if (forwardOnlyOutput !== undefined) {
              if (forwardOnlyOutput) {
                it(`should parse "${input}" (forwardOnly)`, () => {
                  expect(englishDateParser.parse(input, { forwardOnly: true })).to.deep.eq(new Date(forwardOnlyOutput))
                })
              } else {
                it(`should NOT parse "${input}" (forwardOnly)`, () => {
                  expect(englishDateParser.parse(input, { forwardOnly: true })).to.be.null
                })
              }
            }
          } else {
            it(`should NOT parse "${input}"`, () => {
              expect(englishDateParser.parse(input)).to.be.null
            })
          }
        }
      })
    }

    testEach(describe, 'time of day', [
      ['in the morning', '2020-05-05 7:00' , '2020-05-06 7:00'],
      ['at noon',        '2020-05-05 12:00', '2020-05-05 12:00'],
      ['in the evening', '2020-05-05 18:00', '2020-05-05 18:00'],
      ['at night',       '2020-05-05 21:00', '2020-05-05 21:00'],
      ['at midnight',    '2020-05-06 0:00' , '2020-05-06 0:00'],
    ])

    testEach(describe, 'days of week', [
      ['on monday',    '2020-05-04 5:00', '2020-05-11 5:00'],
      ['on tuesday',   '2020-05-05 5:00', '2020-05-12 5:00'],
      ['on wednesday', '2020-05-06 5:00', '2020-05-06 5:00'],
      ['on thursday',  '2020-05-07 5:00', '2020-05-07 5:00'],
      ['on friday',    '2020-05-08 5:00', '2020-05-08 5:00'],
      ['on saturday',  '2020-05-09 5:00', '2020-05-09 5:00'],
      ['on sunday',    '2020-05-10 5:00', '2020-05-10 5:00'],
    ])

    testEach(describe, 'aligned relative date', [
      ['last year',            '2019-01-01 05:00', null],
      ['previous year',        '2019-01-01 05:00', null],
      ['last month',           '2020-04-01 05:00', null],
      ['previous month',       '2020-04-01 05:00', null],
      ['last week',            '2020-04-27 05:00', null],
      ['previous week',        '2020-04-27 05:00', null],
      ['day before yesterday', '2020-05-03 05:00', null],
      ['previous day',         '2020-05-04 05:00', null],
      ['yesterday',            '2020-05-04 05:00', null],
      ['today',                '2020-05-05 05:00', null],
      ['tomorrow',             '2020-05-06 05:00', '2020-05-06 05:00'],
      ['next day',             '2020-05-06 05:00', '2020-05-06 05:00'],
      ['day after tomorrow',   '2020-05-07 05:00', '2020-05-07 05:00'],
      ['next week',            '2020-05-11 05:00', '2020-05-11 05:00'],
      ['next month',           '2020-06-01 05:00', '2020-06-01 05:00'],
      ['next year',            '2021-01-01 05:00', '2021-01-01 05:00'],
    ])

    // last sunday, next tuesday

    testEach(describe, 'relative date', [
      ['5 years ago',    '2015-05-05 10:20', null],
      ['a year ago',     '2019-05-05 10:20', null],
      ['2 months ago',   '2020-03-05 10:20', null],
      ['a month ago',    '2020-04-05 10:20', null],
      ['3 weeks ago',    '2020-04-14 10:20', null],
      ['a week ago',     '2020-04-28 10:20', null],
      ['2 days ago',     '2020-05-03 10:20', null],
      ['a day ago',      '2020-05-04 10:20', null],
      ['20 minutes ago', '2020-05-05 10:00', null],
      ['a minute ago',   '2020-05-05 10:19', null],
      ['now',            '2020-05-05 10:20', '2020-05-05 10:20'],
      ['in a minute',    '2020-05-05 10:21', '2020-05-05 10:21'],
      ['in 15 minutes',  '2020-05-05 10:35', '2020-05-05 10:35'],
      ['in an hour',     '2020-05-05 11:20', '2020-05-05 11:20'],
      ['in 5 hours',     '2020-05-05 15:20', '2020-05-05 15:20'],
      ['in a day',       '2020-05-06 10:20', '2020-05-06 10:20'],
      ['in 2 days',      '2020-05-07 10:20', '2020-05-07 10:20'],
      ['in a week',      '2020-05-12 10:20', '2020-05-12 10:20'],
      ['in 4 weeks',     '2020-06-02 10:20', '2020-06-02 10:20'],
      ['in a month',     '2020-06-05 10:20', '2020-06-05 10:20'],
      ['in 3 months',    '2020-08-05 10:20', '2020-08-05 10:20'],
      ['in a year',      '2021-05-05 10:20', '2021-05-05 10:20'],
      ['in 5 years',     '2025-05-05 10:20', '2025-05-05 10:20'],
    ])

    describe('[complex]', () => {
      testEach(describe, 'days of week + time of day', [
        ['on monday morning',        '2020-05-04 07:00', '2020-05-11 07:00'],
        ['on tuesday evening',       '2020-05-05 18:00', '2020-05-05 18:00'],
        ['on wednesday at midnight', '2020-05-07 0:00',  '2020-05-07 0:00' ],
        ['on thursday at noon',      '2020-05-07 12:00', '2020-05-07 12:00'],
        ['on friday morning',        '2020-05-08 07:00', '2020-05-08 07:00'],
        ['on saturday evening',      '2020-05-09 18:00', '2020-05-09 18:00'],
        ['on sunday night',          '2020-05-10 21:00', '2020-05-10 21:00'],
      ])
    })
  })
})
