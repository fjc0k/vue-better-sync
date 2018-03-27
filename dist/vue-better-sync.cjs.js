/*!
 * vue-better-sync v1.0.9
 * (c) 2018-present fjc0k <fjc0kb@gmail.com>
 * Released under the MIT License.
 */
'use strict';

var cache = Object.create(null);
var camelCase = (function (word) {
  if (!cache[word]) {
    cache[word] = word.replace(/-([a-z])/g, function (_, char) { return char.toUpperCase(); });
  }

  return cache[word];
});

var X_PROXY_PROPS = '_VBS_PROXY_PROPS_';
var X_DATA_PROCESSED = '_VBS_DATA_PROCESSED_';
var X_BEFORE_CREATE_PROCESSED = '_VBS_BEFORE_CREATE_PROCESSED_';
var X_DESYNC = '_VBS_DESYNC_';
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
    var ctx = this.$options;
    if (this[X_DATA_PROCESSED] || !ctx[X_PROXY_PROPS]) { return; }
    this[X_DATA_PROCESSED] = true;
    var proxyProps = ctx[X_PROXY_PROPS];
    return proxyProps.reduce(function (data, proxyPropName) {
      data[proxyPropName] = null;
      return data;
    }, {});
  },

  beforeCreate: function beforeCreate() {
    var ctx = this.$options;
    if (this[X_BEFORE_CREATE_PROCESSED] || !ctx.props) { return; }
    this[X_BEFORE_CREATE_PROCESSED] = true;
    ctx[X_PROXY_PROPS] = [];
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
      var beforeProxyMethod = "beforeProxy" + PropName;
      ctx[X_PROXY_PROPS].push(proxy);

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

      ctx.watch[propName] = {
        immediate: true,

        handler: function handler(newValue, oldValue) {
          var this$1 = this;

          if (newValue !== oldValue) {
            var confirm = function (_newValue) {
              if ( _newValue === void 0 ) _newValue = newValue;

              if (_newValue !== newValue) {
                this$1[X_DESYNC] = true;
              }

              this$1[directSyncMethod](_newValue, oldValue, X_PROP_CHANGED_BY_PARENT);
            };

            var cancel = function () {};

            if (typeof this[beforeProxyMethod] === 'function') {
              this[beforeProxyMethod](oldValue, newValue, confirm, cancel);
            } else {
              confirm();
            }
          }
        }

      };

      ctx.watch[proxy] = function (newValue, oldValue) {
        var this$1 = this;

        if (this[X_DESYNC]) {
          this[X_DESYNC] = false;
          return;
        } // now: this[proxy] === newValue


        if (newValue !== oldValue && newValue !== this[propName]) {
          // so: `this[proxy] = newValue` will not trigger watcher
          var confirm = function (_newValue) {
            if ( _newValue === void 0 ) _newValue = newValue;

            this$1[directSyncMethod](_newValue, oldValue, X_PROP_CHANGED_BY_PROXY);
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

module.exports = index;
