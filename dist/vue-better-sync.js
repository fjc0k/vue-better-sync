/*!
 * vue-better-sync v3.2.1
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
      cache[word] = word.replace(/-([a-z])/g, function (_, char) {
        return char.toUpperCase();
      });
    }

    return cache[word];
  });

  var isFunction = (function (value) {
    return typeof value === 'function';
  });

  var isObject = (function (value) {
    return value !== null && typeof value === 'object';
  });

  /* eslint no-eq-null: 0 eqeqeq: [2, "smart"] */
  var X_PROXY_PROPS = '_VBS_PP_';
  var X_DATA_PROCESSED = '_VBS_DP_';
  var X_BEFORE_CREATE_PROCESSED = '_VBS_BCP_';
  var X_LAST_VALUES_FROM_PARENT = '_VBS_LVFP_';
  var X_LAST_VALUES_FROM_CHILD = '_VBS_LVFC_';
  var X_PROXY_CHANGED_BY_PARENT = '_VBS_PCBP_';
  var X_PROPVALUE_CHANGED_BY_CHILD = '_VBS_PVBC_';
  var X_PROP_CHANGED_BY_PARENT = 0;
  var X_PROP_CHANGED_BY_CHILD = 1;
  var X_WATCH_PROP = 0;
  var X_WATCH_PROXY = 1;
  var index = (function (model) {
    var mixin = {
      data: function data() {
        var ctx = this.$options;
        if (this[X_DATA_PROCESSED] || !ctx[X_PROXY_PROPS]) return;
        this[X_DATA_PROCESSED] = true;
        var proxyProps = ctx[X_PROXY_PROPS];
        return proxyProps.reduce(function (data, proxyPropName) {
          data[proxyPropName] = null;
          return data;
        }, {});
      },
      beforeCreate: function beforeCreate() {
        var ctx = this.$options;
        if (this[X_BEFORE_CREATE_PROCESSED] || !ctx.props) return;
        this[X_BEFORE_CREATE_PROCESSED] = true;
        ctx[X_PROXY_PROPS] = [];
        this[X_LAST_VALUES_FROM_PARENT] = {};
        this[X_LAST_VALUES_FROM_CHILD] = {};
        ctx.methods = ctx.methods || {};
        ctx.watch = ctx.watch || {};
        Object.keys(ctx.props).forEach(function (propName) {
          var isSync = ctx.props[propName].sync;
          var isModel = isObject(model) && model.prop === propName;
          if (!isModel && !isSync) return;
          var PropName = camelCase("-" + propName);
          var proxy = "local" + PropName;
          var syncMethod = "sync" + PropName;
          var directSyncMethod = "sync" + PropName + "Directly";
          var transformPropMethod = "transform" + PropName;
          var transformProxyMethod = "transformLocal" + PropName;
          var watchMethod = "_VBS_W_" + propName + "_";
          var onPropChange = "on" + PropName + "Change";
          var onProxyChange = "onLocal" + PropName + "Change";
          ctx[X_PROXY_PROPS].push(proxy);

          ctx.methods[directSyncMethod] = function (newValue, oldValue, propChangedBy) {
            if (oldValue !== newValue) {
              if (propChangedBy === X_PROP_CHANGED_BY_PARENT && newValue !== this[X_LAST_VALUES_FROM_CHILD][propName]) {
                this[X_PROXY_CHANGED_BY_PARENT] = true;
                this[proxy] = newValue;
              }

              if (propChangedBy === X_PROP_CHANGED_BY_CHILD && newValue !== this[X_LAST_VALUES_FROM_PARENT][propName]) {
                this[X_PROPVALUE_CHANGED_BY_CHILD] = true;

                if (isModel) {
                  this.$emit(model.event || 'input', newValue, oldValue);
                }

                if (isSync) {
                  this.$emit("update:" + propName, newValue, oldValue);
                }
              }
            }
          };

          ctx.methods[syncMethod] = function (newValue) {
            // Compatible to Event value
            if (newValue instanceof Event && newValue.target && newValue.target.value) {
              newValue = newValue.target.value;
            }

            this[proxy] = newValue;
          };

          ctx.methods[watchMethod] = function (newValue, oldValue, from) {
            if (newValue !== oldValue) {
              var fromProp = from === X_WATCH_PROP;
              var CHANGED_BY = fromProp ? X_PROP_CHANGED_BY_PARENT : X_PROP_CHANGED_BY_CHILD;
              var transformMethod = fromProp ? transformPropMethod : transformProxyMethod;

              if (isFunction(this[transformMethod])) {
                var transformedValue = this[transformMethod]({
                  oldValue: oldValue,
                  newValue: newValue
                });

                if (isObject(transformedValue)) {
                  oldValue = transformedValue.oldValue;
                  newValue = transformedValue.newValue;
                }
              }

              if (newValue !== oldValue) {
                if (fromProp) {
                  if (isFunction(this[onPropChange])) {
                    this[onPropChange](newValue, oldValue);
                  }
                } else if (isFunction(this[onProxyChange])) {
                  this[onProxyChange](newValue, oldValue);
                }

                this[directSyncMethod](newValue, oldValue, CHANGED_BY);
              }
            }
          };

          ctx.watch[propName] = {
            immediate: true,
            handler: function handler(newValue, oldValue) {
              this[X_LAST_VALUES_FROM_PARENT][propName] = newValue;

              if (this[X_PROPVALUE_CHANGED_BY_CHILD]) {
                this[X_PROPVALUE_CHANGED_BY_CHILD] = false;
                return;
              }

              this[watchMethod](newValue, oldValue, X_WATCH_PROP);
            }
          };
          ctx.watch[proxy] = {
            immediate: true,
            handler: function handler(newValue, oldValue) {
              this[X_LAST_VALUES_FROM_CHILD][propName] = newValue;

              if (this[X_PROXY_CHANGED_BY_PARENT]) {
                this[X_PROXY_CHANGED_BY_PARENT] = false;
                return;
              }

              this[watchMethod](newValue, oldValue, X_WATCH_PROXY);
            }
          };
        });
      }
    };

    if (model) {
      mixin.model = model;
    }

    return mixin;
  });

  return index;

})));
