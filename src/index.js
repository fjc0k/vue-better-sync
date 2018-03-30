/* eslint no-eq-null: 0 eqeqeq: [2, "smart"] */
import { camelCase } from './utils'

const X_PROXY_PROPS = '_VBS_PP_'
const X_DATA_PROCESSED = '_VBS_DP_'
const X_BEFORE_CREATE_PROCESSED = '_VBS_BCP_'
const X_LAST_VALUES_FROM_PARENT = '_VBS_LVFP_'
const X_LAST_VALUES_FROM_CHILD = '_VBS_LVFC_'
const X_PROXY_CHANGED_BY_PARENT = '_VBS_PCBP_'
const X_PROP_CHANGED_BY_PARENT = 1
const X_PROP_CHANGED_BY_CHILD = 2

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

      ctx.watch[propName] = {
        immediate: true,
        handler(newValue, oldValue) {
          if (newValue !== oldValue) {
            this[X_LAST_VALUES_FROM_PARENT][propName] = newValue
            if (typeof this[transformMethod] === 'function') {
              newValue = newValue == null ? newValue : this[transformMethod](newValue, true)
              oldValue = oldValue == null ? oldValue : this[transformMethod](oldValue, true)
            }
            if (newValue !== oldValue) {
              this[directSyncMethod](
                newValue,
                oldValue,
                X_PROP_CHANGED_BY_PARENT
              )
            }
          }
        }
      }

      ctx.watch[proxy] = function (newValue, oldValue) {
        if (this[X_PROXY_CHANGED_BY_PARENT]) return
        if (newValue !== oldValue) {
          this[X_LAST_VALUES_FROM_CHILD][propName] = newValue
          if (typeof this[transformMethod] === 'function') {
            newValue = newValue == null ? newValue : this[transformMethod](newValue, false)
            oldValue = oldValue == null ? oldValue : this[transformMethod](oldValue, false)
          }
          if (newValue !== oldValue) {
            this[directSyncMethod](
              newValue,
              oldValue,
              X_PROP_CHANGED_BY_CHILD
            )
          }
        }
      }
    })
  }
})
