var hydration = require('../')
  , assert = require('assert')
  ;

describe('hydration', function() {
  it('can rehydrate a complex object', function() {
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

  it('supports custom types', function () {
    function OogaBooga (name) {
      this.name = name
    }

    var custom = hydration()
    custom.addType('heyho', {
      test: function (val) {
        return typeof val === 'object' && val.hey === 'ho'
      },
      dehydrate: function (val) {
        return 100
      },
      hydrate: function (val) {
        return { hey: 'ho' }
      }
    })

    custom.addType('oogabooga', {
      test: function (val) {
        return val instanceof OogaBooga
      },
      dehydrate: function (val) {
        return val.name
      },
      hydrate: function (val) {
        return new OogaBooga(val)
      }
    })

    var obj = {
      a: { hey: 'ho' },
      b: new OogaBooga('yum')
    }

    var dehydrated = custom.dehydrate(obj)
    assert.equal(dehydrated.a, 100)

    var hydrated = custom.hydrate(dehydrated)
    assert.deepEqual(obj, hydrated, 'hydrated object equals original')
  })
});
