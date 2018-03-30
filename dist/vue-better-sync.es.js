/*!
 * vue-better-sync v2.1.2
 * (c) 2018-present fjc0k <fjc0kb@gmail.com>
 * Released under the MIT License.
 */
var cache = Object.create(null);
var camelCase = (function (word) {
  if (!cache[word]) {
    cache[word] = word.replace(/-([a-z])/g, function (_, char) { return char.toUpperCase(); });
  }

  return cache[word];
});

/* eslint no-eq-null: 0 eqeqeq: [2, "smart"] */
var X_PROXY_PROPS = '_VBS_PP_';
var X_DATA_PROCESSED = '_VBS_DP_';
var X_BEFORE_CREATE_PROCESSED = '_VBS_BCP_';
var X_LAST_VALUES_FROM_PARENT = '_VBS_LVFP_';
var X_LAST_VALUES_FROM_CHILD = '_VBS_LVFC_';
var X_PROXY_CHANGED_BY_PARENT = '_VBS_PCBP_';
var X_PROP_CHANGED_BY_PARENT = 1;
var X_PROP_CHANGED_BY_CHILD = 2;
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
    this[X_LAST_VALUES_FROM_PARENT] = {};
    this[X_LAST_VALUES_FROM_CHILD] = {};
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
      var transformMethod = "transform" + PropName;
      ctx[X_PROXY_PROPS].push(proxy);

      ctx.methods[directSyncMethod] = function (newValue, oldValue, propChangedBy) {
        if (oldValue !== newValue) {
          if (propChangedBy === X_PROP_CHANGED_BY_PARENT && newValue !== this[X_LAST_VALUES_FROM_CHILD][propName] && newValue !== this[proxy]) {
            this[X_PROXY_CHANGED_BY_PARENT] = true;
            this[proxy] = newValue;
          }

          if (propChangedBy === X_PROP_CHANGED_BY_CHILD && newValue !== this[X_LAST_VALUES_FROM_PARENT][propName]) {
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
        // Compatible to Event value
        if (newValue instanceof Event && newValue.target && newValue.target.value) {
          newValue = newValue.target.value;
        }

        this[proxy] = newValue;
      };

      ctx.watch[propName] = {
        immediate: true,

        handler: function handler(newValue, oldValue) {
          if (newValue !== oldValue) {
            this[X_LAST_VALUES_FROM_PARENT][propName] = newValue;

            if (typeof this[transformMethod] === 'function') {
              newValue = newValue == null ? newValue : this[transformMethod](newValue, true);
              oldValue = oldValue == null ? oldValue : this[transformMethod](oldValue, true);
            }

            if (newValue !== oldValue) {
              this[directSyncMethod](newValue, oldValue, X_PROP_CHANGED_BY_PARENT);
            }
          }
        }

      };

      ctx.watch[proxy] = function (newValue, oldValue) {
        if (this[X_PROXY_CHANGED_BY_PARENT]) {
          this[X_PROXY_CHANGED_BY_PARENT] = false;
          return;
        }

        if (newValue !== oldValue) {
          this[X_LAST_VALUES_FROM_CHILD][propName] = newValue;

          if (typeof this[transformMethod] === 'function') {
            newValue = newValue == null ? newValue : this[transformMethod](newValue, false);
            oldValue = oldValue == null ? oldValue : this[transformMethod](oldValue, false);
          }

          if (newValue !== oldValue) {
            this[directSyncMethod](newValue, oldValue, X_PROP_CHANGED_BY_CHILD);
          }
        }
      };
    });
  }

});
});

export default index;
