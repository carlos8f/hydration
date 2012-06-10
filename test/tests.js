var hydration = require('../')
  , assert = require('assert')
  ;

describe('hydration', function() {
  it('can rehydrate complex object', function() {
    var obj = {
      history: {
        'may 14th 2012': {
          birthdays: ['erin', 'mark', new Date(), /something/],
          hours: 24
        },
        today: {
          date: new Date()
        }
      },
      patterns: [/blah/, /etc/]
    };
    var dehydrated = hydration.dehydrate(obj);
    var hydrated = hydration.hydrate(dehydrated);
    assert.deepEqual(obj, hydrated, 'hydrated object equals original');
  });
  it('can hydrate types after JSON conversion', function() {
    var obj = {
      regex: /my regex/,
      date: new Date(),
      array: ['blah', 'etc'],
      object: {property: 'test', other: {something: true}},
      number: 1.01234,
      hex: 0xffffff,
      string: 'hello'
    };
    var dehydrated = JSON.stringify(hydration.dehydrate(obj));
    var hydrated = hydration.hydrate(JSON.parse(dehydrated));
    assert.deepEqual(obj, hydrated, 'hydrated object equals original');
  });
});