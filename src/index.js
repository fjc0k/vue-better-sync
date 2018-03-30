/* eslint no-eq-null: 0 eqeqeq: [2, "smart"] */
import { camelCase, isFunction, isObject } from './utils'

const X_PROXY_PROPS = '_VBS_PP_'
const X_DATA_PROCESSED = '_VBS_DP_'
const X_BEFORE_CREATE_PROCESSED = '_VBS_BCP_'
const X_LAST_VALUES_FROM_PARENT = '_VBS_LVFP_'
const X_LAST_VALUES_FROM_CHILD = '_VBS_LVFC_'
const X_PROXY_CHANGED_BY_PARENT = '_VBS_PCBP_'
const X_PROP_CHANGED_BY_PARENT = 0
const X_PROP_CHANGED_BY_CHILD = 1
const X_WATCH_PROP = 0
const X_WATCH_PROXY = 1

export default ({
  prop = 'value',
  event = 'input'
} = {}) => ({
  model: { prop, event },

  data() {
    const ctx = this.$options

    if (this[X_DATA_PROCESSED] || !ctx[X_PROXY_PROPS]) return

    this[X_DATA_PROCESSED] = true
    const proxyProps = ctx[X_PROXY_PROPS]

    return proxyProps.reduce((data, proxyPropName) => {
      data[proxyPropName] = null
      return data
    }, {})
  },

  beforeCreate() {
    const ctx = this.$options

    if (this[X_BEFORE_CREATE_PROCESSED] || !ctx.props) return

    this[X_BEFORE_CREATE_PROCESSED] = true
    ctx[X_PROXY_PROPS] = []
    this[X_LAST_VALUES_FROM_PARENT] = {}
    this[X_LAST_VALUES_FROM_CHILD] = {}
    ctx.methods = ctx.methods || {}
    ctx.watch = ctx.watch || {}

    Object.keys(ctx.props).forEach(propName => {
      const { sync: isSync } = ctx.props[propName]

      const isModel = prop === propName

      if (!isModel && !isSync) return

      const PropName = camelCase(`-${propName}`)
      const proxy = `actual${PropName}`
      const syncMethod = `sync${PropName}`
      const directSyncMethod = `sync${PropName}Directly`
      const transformMethod = `transform${PropName}`
      const watchMethod = `_VBS_W_${propName}_`

      ctx[X_PROXY_PROPS].push(proxy)

      ctx.methods[directSyncMethod] = function (newValue, oldValue, propChangedBy) {
        if (oldValue !== newValue) {
          if (
            propChangedBy === X_PROP_CHANGED_BY_PARENT &&
            newValue !== this[X_LAST_VALUES_FROM_CHILD][propName] &&
            newValue !== this[proxy]
          ) {
            this[X_PROXY_CHANGED_BY_PARENT] = true
            this[proxy] = newValue
          }
          if (
            propChangedBy === X_PROP_CHANGED_BY_CHILD &&
            newValue !== this[X_LAST_VALUES_FROM_PARENT][propName]
          ) {
            if (isModel) {
              this.$emit(event, newValue, oldValue)
            }
            if (isSync) {
              this.$emit(`update:${propName}`, newValue, oldValue)
            }
          }
        }
      }

      ctx.methods[syncMethod] = function (newValue) {
        // Compatible to Event value
        if (newValue instanceof Event && newValue.target && newValue.target.value) {
          newValue = newValue.target.value
        }
        this[proxy] = newValue
      }

      ctx.methods[watchMethod] = function (newValue, oldValue, from) {
        if (newValue !== oldValue) {
          const fromProp = from === X_WATCH_PROP
          const LAST_VALUES_FROM = fromProp ? X_LAST_VALUES_FROM_PARENT : X_LAST_VALUES_FROM_CHILD
          const CHANGED_BY = fromProp ? X_PROP_CHANGED_BY_PARENT : X_PROP_CHANGED_BY_CHILD
          this[LAST_VALUES_FROM][propName] = newValue
          if (isFunction(this[transformMethod])) {
            const transformedValue = this[transformMethod](
              { oldValue, newValue },
              fromProp
            )
            if (isObject(transformedValue)) {
              oldValue = transformedValue.oldValue
              newValue = transformedValue.newValue
            }
          }
          if (newValue !== oldValue) {
            this[directSyncMethod](
              newValue,
              oldValue,
              CHANGED_BY
            )
          }
        }
      }

      ctx.watch[propName] = {
        immediate: true,
        handler(newValue, oldValue) {
          this[watchMethod](newValue, oldValue, X_WATCH_PROP)
        }
      }

      ctx.watch[proxy] = {
        immediate: true,
        handler(newValue, oldValue) {
          if (this[X_PROXY_CHANGED_BY_PARENT]) {
            this[X_PROXY_CHANGED_BY_PARENT] = false
            return
          }
          this[watchMethod](newValue, oldValue, X_WATCH_PROXY)
        }
      }
    })
  }
})
