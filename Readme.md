hydration
---------

Type-accurate serialization of javascript objects

[![build status](https://secure.travis-ci.org/carlos8f/hydration.png)](http://travis-ci.org/carlos8f/hydration)

## Usage

### Basic

out-of-the-box support for Date, RegExp, arrays, buffers

```js
var hydra = require('hydration')
var obj = {
  date: new Date(),
  regex: /^something/,
  array: ['of', 747]
}

// basic

var dehydrated = hydra.dehydrate(obj)
// JSON.stringify + JSON.parse if you like
var hydrated = hydra.hydrate(dehydrated)

// hydrated deepEquals obj
```

### Advanced

you can add support for custom types yourself

```js
var hydra = require('hydration')

function OogaBooga (name) {
  this.name = name
}

var custom = hydra()
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
  //...
  someprop: new OogaBooga('yum')
  //...
}

var dehydrated = custom.dehydrate(obj)
// JSON.stringify + JSON.parse if you like
var hydrated = custom.hydrate(dehydrated)
```

## Thanks

Thanks to [@mvayngrib](https://github.com/mvayngrib) for Buffer and custom type support, and documentation.

License
=======

MIT
