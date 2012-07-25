var util = require('util');

function dehydrate(input) {
  var obj = {};
  Object.keys(input).forEach(function(k) {
    obj[k] = input[k];
  });
  obj._types = {};

  Object.keys(obj).forEach(function(k) {
    if (k == '_types') {
      return;
    }
    var type = getType(obj[k]);
    // Strings are implied
    if (type !== 'string') {
      obj._types[k] = type;
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
    }
  });
  if (Object.keys(obj._types).length === 0) {
    delete obj._types;
  }
  return obj;
};
exports.dehydrate = dehydrate;

function getType(obj) {
  if (util.isArray(obj)) {
    return 'array';
  }
  else if (util.isRegExp(obj)) {
    return 'regexp';
  }
  else if (util.isDate(obj)) {
    return 'date';
  }
  else {
    return typeof obj;
  }
}

function hydrate(input) {
  var obj = {};
  Object.keys(input).forEach(function(k) {
    obj[k] = input[k];
  });
  if (!obj._types) {
    return obj;
  }
  Object.keys(obj).forEach(function(k) {
    if (k == '_types') {
      return;
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
    }
  });
  delete obj._types;
  return obj;
};
exports.hydrate = hydrate;
