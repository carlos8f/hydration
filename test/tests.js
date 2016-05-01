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
        },
        buffer: new Buffer('hey ho'),
        tricky: null
      },
      patterns: [/blah/, /etc/],
      emptyArray: [],
      emptyBoj: {}
    };
    var dehydrated = hydration.dehydrate(obj);
    var hydrated = hydration.hydrate(dehydrated);
    assert.deepStrictEqual(obj, hydrated, 'hydrated object equals original');
  });
  it('can hydrate types after JSON conversion', function() {
    var obj = {
      regex: /my regex/,
      date: new Date(),
      array: ['blah', 'etc'],
      object: {property: 'test', other: {something: true}},
      number: 1.01234,
      buffer: new Buffer('hey hey'),
      hex: 0xffffff,
      string: 'hello',
      bool: true,
      tricky: null
    };
    var dehydrated = JSON.stringify(hydration.dehydrate(obj));
    var hydrated = hydration.hydrate(JSON.parse(dehydrated));
    assert.deepStrictEqual(obj, hydrated, 'hydrated object equals original');
  });
  it('can hydrate types after JSON conversion with string booleans', function() {
    var obj = {
      'zero': false,
      'false': false,
      'true': true,
      'truthy': true
    };
    var dehydrated = hydration.dehydrate(obj);
    dehydrated['zero'] = '0';
    dehydrated['false'] = 'false';
    dehydrated['true'] = 'true'
    dehydrated['truthy'] = 'bazinga!';
    dehydrated = JSON.stringify(dehydrated);
    var hydrated = hydration.hydrate(JSON.parse(dehydrated));
    assert.deepEqual(obj, hydrated, 'hydrated object equals original');
  });

  it('passes through primitive types and nulls', function () {
    ['hey', 1, true, null].forEach(function (val) {
      assert.equal(hydration.hydrate(val), val);
      assert.equal(hydration.dehydrate(val), val);
    })
  });
});
