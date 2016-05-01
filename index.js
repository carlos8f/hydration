function dehydrate(input) {
  var obj = {}, k, typeCount = 0;
  for (k in input) {
    if (!input.hasOwnProperty(k)) continue;
    obj[k] = input[k];
  }
  obj.__proto__ = input.__proto__; // so prototype.toJSON() will still fire
  obj._types = {};

  for (k in obj) {
    if (!obj.hasOwnProperty(k)) continue;
    if (k == '_types') {
      continue
    }
    var type = getType(obj[k]);
    // Strings are implied
    if (type !== 'string') {
      obj._types[k] = type;
      typeCount++;
    }
    switch (type) {
      case 'array':
        // Convert to an object so we can store types.
        var newObj = {};
        for (var i in obj[k]) {
          newObj[i] = obj[k][i];
        }
        obj[k] = newObj;
        obj[k] = dehydrate(obj[k]);
        break;
      case 'regexp':
        obj[k] = obj[k].toString();
        break;
      case 'object':
        obj[k] = dehydrate(obj[k]);
        break;
      case 'buffer':
        obj[k] = obj[k].toString('base64');
        break;
    }
  }

  if (typeCount === 0) {
    delete obj._types;
  }
  return obj;
};
exports.dehydrate = dehydrate;

function getType(obj) {
  if (typeof obj === 'object') {
    var str = Object.prototype.toString.call(obj);
    if (str === '[object Array]') {
      return 'array';
    }
    else if (str === '[object RegExp]') {
      return 'regexp';
    }
    else if (str === '[object Date]') {
      return 'date';
    }
    else if (str === '[object Null]') {
      return 'null';
    }
    else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj)) {
      return 'buffer';
    }

    return 'object';
  }
  return typeof obj;
}

function hydrate(input) {
  var obj = {}, k;
  for (k in input) {
    if (!input.hasOwnProperty(k)) continue;
    obj[k] = input[k];
  }
  if (!obj._types) {
    return obj;
  }
  for (k in obj) {
    if (!obj.hasOwnProperty(k)) continue;
    if (k == '_types') {
      continue;
    }
    switch (obj._types[k]) {
      case 'boolean':
        if (typeof obj[k] === 'string') {
          if (obj[k] === 'false' || obj[k] === '0') {
            obj[k] = false;
          }
          else {
            obj[k] = true;
          }
        }
        break;
      case 'date':
        if (typeof obj[k] == 'string') {
          obj[k] = new Date(obj[k]);
        }
        break;
      case 'regexp':
        obj[k] = new RegExp(obj[k].replace(/(^\/|\/$)/g, ''));
        break;
      case 'number':
        obj[k] = parseFloat(obj[k]);
        break;
      case 'array':
        obj[k] = hydrate(obj[k]);
        // Convert back to array.
        var newArr = [];
        for (var i in obj[k]) {
          newArr.push(obj[k][i]);
        }
        obj[k] = newArr;
        break;
      case 'object':
        obj[k] = hydrate(obj[k]);
        break;
      case 'buffer':
        obj[k] = new Buffer(obj[k], 'base64')
        break;
      case 'null':
        obj[k] = null;
        break;
    }
  }
  delete obj._types;
  return obj;
}
exports.hydrate = hydrate;
