
var builtInTypes = {
  string: {
    test: function (val) {
      return typeof val === 'string'
    },
    dehydrate: identity,
    hydrate: identity
  },
  'null': {
    test: function (val) {
      return val == null
    },
    hydrate: function () {
      return null
    },
    dehydrate: function () {
      return ''
    }
  },
  number: {
    test: function (val) {
      return typeof val === 'number'
    },
    hydrate: function (val) {
      return parseFloat(val)
    },
    dehydrate: toString
  },
  date: {
    test: function (val, str) {
      return str === '[object Date]'
    },
    hydrate: function (val) {
      return new Date(parseInt(val))
    },
    dehydrate: function (val) {
      return +val
    }
  },
  boolean: {
    test: function (val) {
      return typeof val === 'boolean'
    },
    hydrate: function (val) {
      return val === 'false' || val === '0' ? false : true
    },
    dehydrate: toString
  },
  regexp: {
    test: function (val, str) {
      return str === '[object RegExp]'
    },
    hydrate: function (val) {
      return new RegExp(val.replace(/(^\/|\/$)/g, ''))
    },
    dehydrate: toString
  },
  buffer: {
    test: function (val) {
      return Buffer.isBuffer(val)
    },
    hydrate: function (val) {
      return new Buffer(val, 'base64')
    },
    dehydrate: function (val) {
      return val.toString('base64')
    }
  },
  array: {
    test: function (val) {
      return Array.isArray(val)
    },
    dehydrate: function (arr, hydra) {
      // Convert to an object so we can store types.
      var newObj = {}
      for (var i = 0; i < arr.length; i++) {
        newObj[i] = arr[i]
      }

      return hydra.dehydrate(newObj, hydra)
    },
    hydrate: function (val, hydra) {
      val = hydra.hydrate(val)

      // Convert back to array.
      var newArr = new Array(Object.keys(val).length)
      for (var i in val) {
        newArr[i] = val[i]
      }

      return newArr
    }
  },
  object: {
    type: function (val) {
      return val && typeof val === 'object'
    },
    hydrate: function (val, hydra) {
      return hydra.hydrate(val)
    },
    dehydrate: function (val, hydra) {
      return hydra.dehydrate(val)
    }
  }
}

function identity (val) {
  return val
}

function toString (val) {
  return val.toString ? val.toString() : val
}

function hydra (opts) {
  var byType = {}
  for (var name in builtInTypes) {
    byType[name] = builtInTypes[name]
  }

  var api = {
    hydrate: hydrate,
    dehydrate: dehydrate,
    addType: addType
  }

  return api

  function dehydrate (input) {
    if (isPrimitiveOrNull(input)) return input

    var obj = {}, k, typeCount = 0
    obj.__proto__ = input.__proto__ // so prototype.toJSON() will still fire
    obj._types = {}

    for (k in input) {
      if (!input.hasOwnProperty(k)) continue

      var val = input[k]
      var name = getType(val)
      if (!name) throw new Error('missing dehydrator for property: ' + k)

      typeCount++
      var hd = byType[name]
      obj._types[k] = name
      obj[k] = hd.dehydrate(val, api)
    }

    if (typeCount === 0) {
      delete obj._types
    }

    return obj
  }

  function hydrate (input) {
    if (isPrimitiveOrNull(input)) return input
    if (!input._types) return input

    var obj = {}, k
    for (k in input) {
      if (!input.hasOwnProperty(k)) continue
      if (k == '_types') {
        continue
      }

      var name = input._types[k]
      var hd = byType[name]
      if (!hd) throw new Error('missing hydrator for type: ' + k)

      obj[k] = hd.hydrate(input[k], api)
    }

    delete obj._types
    return obj
  }

  function getType (val) {
    var str = Object.prototype.toString.call(val)
    for (var name in byType) {
      if (name === 'object') continue
      if (byType[name].test(val, str)) return name
    }

    // fallback to object
    return typeof val === 'object' ? 'object' : null
  }

  function addType (name, opts) {
    assert(typeof opts === 'object', 'expected "opts"')
    assert(typeof opts.test === 'function', 'expected "test"')
    assert(typeof opts.hydrate === 'function', 'expected "hydrate"')
    assert(typeof opts.dehydrate === 'function', 'expected "dehydrate"')

    if (name in byType) {
      throw new Error('type "' + name + '" already exists!')
    }

    // defensive copy
    byType[name] = {
      test: opts.test,
      hydrate: opts.hydrate,
      dehydrate: opts.dehydrate
    }

    return api
  }
}

function isPrimitiveOrNull (input) {
  return input == null || typeof input !== 'object'
}

function assert (statement, msg) {
  if (!statement) throw new Error(msg)
}


module.exports = hydra

// backwards compatibility
var builtIn = hydra()
module.exports.hydrate = builtIn.hydrate
module.exports.dehydrate = builtIn.dehydrate
