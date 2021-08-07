import { expect } from 'chai';
import { parseTimezoneOffsetMinutes } from '../../app/messages/timezone.js';

describe('[timezone message]', () => {
    describe('parseTimezoneOffsetMinutes()', () => {
        it('should parse timezones', () => {
            for (const [value, result] of [
                ['UTC', 0],
                ['UTC-0', 0],
                ['UTC+0', 0],
                ['UTC0', 0],
                ['UTC3', 180],
                ['UTC+3', 180],
                ['UTC-3', -180],
                ['UTC6', 360],
                ['UTC+6:00', 360],
                ['UTC-6:00', -360],
                ['UTC2:30', 150],
                ['UTC+02:30', 150],
                ['UTC-02:30', -150],
                ['GMT', 0],
                ['GMT0', 0],
                ['GMT-0', 0],
                ['GMT+0', 0],
                ['GMT+3', 180],
                ['GMT3', 180],
                ['GMT-3', -180],
                ['GMT6:00', 360],
                ['GMT+6:00', 360],
                ['GMT-6:00', -360],
                ['GMT+6:0', 360],
                ['GMT-6:0', -360],
                ['GMT2:30', 150],
                ['GMT+02:30', 150],
                ['GMT-02:30', -150],
                ['0', 0],
                ['-0', 0],
                ['+0', 0],
                ['3', 180],
                ['+3', 180],
                ['-3', -180],
                ['6:00', 360],
                ['+06:00', 360],
                ['-06:00', -360],
                ['2:30', 150],
                ['+2:30', 150],
                ['-2:30', -150],
                ['6:0', 360],
                ['+6:0', 360],
                ['-6:0', -360],
            ]) {
                expect(parseTimezoneOffsetMinutes(value), value).to.equal(result);
            }
        });
    
        it('should return null for invalid timezones', () => {
            for (const value of [
                'Hello World!',
                'AFK',
                'AFK-0',
                'AFK+0',
                'AFK+3',
                'AFK-3',
                'AFK+6:00',
                'AFK-6:00',
                'AFK+2:30',
                'AFK-2:30',
                'GMT-a',
                'GMT+a',
                'GMT+a',
                'GMT-a',
                'GMT+a:bc',
                'GMT-a:bc',
                'UTC-a',
                'UTC+a',
                'UTC+a',
                'UTC-a',
                'UTC+a:bc',
                'UTC-a:bc',
                'AFK-0',
                '+a',
                '-a',
                '+a:bc',
                '-a:bc',
                'UTC-12.30:30.60',
                'UTC+0.3',
                'UTC-0.5:00',
            ]) {
                expect(parseTimezoneOffsetMinutes(value), value).to.be.null;
            }
        });
    });
});
