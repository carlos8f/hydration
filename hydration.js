;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("hydration/index.js", function(exports, require, module){
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
      case 'null':
        obj[k] = null;
        break;
    }
  }
  delete obj._types;
  return obj;
}
exports.hydrate = hydrate;

});
require.alias("hydration/index.js", "hydration/index.js");

if (typeof exports == "object") {
  module.exports = require("hydration");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("hydration"); });
} else {
  this["hydration"] = require("hydration");
}})();