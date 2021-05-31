const Cache = require('../../app/utils/Cache');

describe('Cache', () => {
    const TTL_MS = 14600;

    /** @type {Cache} */
    let cache;
    let clock;

    beforeEach(() => {
        clock = sinon.useFakeTimers(new Date('2020-05-05 10:00'));

        cache = new Cache(TTL_MS);
    });

    afterEach(() => {
        clock.restore();
    });

    // TODO:
});