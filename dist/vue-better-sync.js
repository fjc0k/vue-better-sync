/*!
 * vue-better-sync v1.0.4
 * (c) 2018-present fjc0k <fjc0kb@gmail.com>
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueBetterSync = factory());
}(this, (function () { 'use strict';

var cache = Object.create(null);
var camelCase = (function (word) {
  if (!cache[word]) {
    cache[word] = word.replace(/-([a-z])/g, function (_, char) { return char.toUpperCase(); });
  }

  return cache[word];
});

var X_DATA_PROPS = '_DATA_PROPS_';
var X_PROP_CHANGED_BY_PARENT = 1;
var X_PROP_CHANGED_BY_PROXY = 2;
var index = (function (ref) {
  if ( ref === void 0 ) ref = {};
  var prop = ref.prop; if ( prop === void 0 ) prop = 'value';
  var event = ref.event; if ( event === void 0 ) event = 'input';

  return ({
  model: {
    prop: prop,
    event: event
  },

  data: function data() {
    var this$1 = this;

    var props = this.$options[X_DATA_PROPS] || {};
    return Object.keys(props).reduce(function (data, proxy) {
      data[proxy] = this$1[props[proxy]];
      return data;
    }, {});
  },

  beforeCreate: function beforeCreate() {
    var ctx = this.$options;
    if (!ctx.props) { return; }
    ctx[X_DATA_PROPS] = {};
    ctx.methods = ctx.methods || {};
    ctx.watch = ctx.watch || {};
    Object.keys(ctx.props).forEach(function (propName) {
      var ref = ctx.props[propName];
      var isSync = ref.sync;
      var isModel = prop === propName;
      if (!isModel && !isSync) { return; }
      var PropName = camelCase(("-" + propName));
      var proxy = "actual" + PropName;
      var syncMethod = "sync" + PropName;
      var directSyncMethod = "sync" + PropName + "Directly";
      var beforeSyncMethod = "beforeSync" + PropName;
      ctx[X_DATA_PROPS][proxy] = propName;

      ctx.methods[directSyncMethod] = function (newValue, oldValue, propChangedBy) {
        if (oldValue !== newValue) {
          if (propChangedBy !== X_PROP_CHANGED_BY_PROXY) {
            this[proxy] = newValue;
          }

          if (propChangedBy !== X_PROP_CHANGED_BY_PARENT) {
            if (isModel) {
              this.$emit(event, newValue, oldValue);
            }

            if (isSync) {
              this.$emit(("update:" + propName), newValue, oldValue);
            }
          }
        }
      };

      ctx.methods[syncMethod] = function (newValue) {
        this[proxy] = newValue;
      };

      ctx.watch[propName] = function (newValue, oldValue) {
        if (newValue !== oldValue) {
          this[directSyncMethod](newValue, oldValue, X_PROP_CHANGED_BY_PARENT);
        }
      };

      ctx.watch[proxy] = function (newValue, oldValue) {
        var this$1 = this;

        // now: this[proxy] === newValue
        if (newValue !== oldValue && newValue !== this[propName]) {
          // so: `this[proxy] = newValue` will not trigger watcher
          var confirm = function () {
            this$1[directSyncMethod](newValue, oldValue, X_PROP_CHANGED_BY_PROXY);
          };

          var cancel = function () {
            this$1[proxy] = oldValue;
          };

          if (typeof this[beforeSyncMethod] === 'function') {
            this[beforeSyncMethod](oldValue, newValue, confirm, cancel);
          } else {
            confirm();
          }
        }
      };
    });
  }

});
});

return index;

})));
