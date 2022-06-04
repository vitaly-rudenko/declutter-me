import { expect } from 'chai'
import sinon from 'sinon'

import { EnglishDateParser } from '../../index.js'

describe.only('EnglishDateParser', () => {
  /** @type {EnglishDateParser} */
  let englishDateParser
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2020-05-05 10:00')) // tuesday

    englishDateParser = new EnglishDateParser({
      references: {
        morningHours: 7,
        eveningHours: 18,
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
          it(`should parse "${input}"`, () => {
            expect(englishDateParser.parse(input, options)).to.deep.eq(new Date(output))
          })
        }
      })
    }

    testEach(describe, 'time of day', [
      ['at midnight',    '2020-05-05 0:00'],
      ['in the morning', '2020-05-05 7:00'],
      ['at noon',        '2020-05-05 12:00'],
      ['in the evening', '2020-05-05 18:00'],
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

    testEach(describe, 'postponed', [
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

    describe('[forwardOnly]', () => {
      testEach(describe, 'time of day', [
        ['at midnight',    '2020-05-06 0:00'],
        ['in the morning', '2020-05-06 7:00'],
        ['at noon',        '2020-05-05 12:00'],
        ['in the evening', '2020-05-05 18:00'],
      ], { forwardOnly: true })
  
      testEach(describe, 'days of week', [
        ['on monday',    '2020-05-11 10:00'],
        ['on tuesday',   '2020-05-12 10:00'],
        ['on wednesday', '2020-05-06 10:00'],
        ['on thursday',  '2020-05-07 10:00'],
        ['on friday',    '2020-05-08 10:00'],
        ['on saturday',  '2020-05-09 10:00'],
        ['on sunday',    '2020-05-10 10:00'],
      ], { forwardOnly: true })
    })
  })
})
