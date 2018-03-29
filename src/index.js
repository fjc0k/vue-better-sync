import { camelCase } from './utils'

const X_PROXY_PROPS = '_VBS_PROXY_PROPS_'
const X_DATA_PROCESSED = '_VBS_DATA_PROCESSED_'
const X_BEFORE_CREATE_PROCESSED = '_VBS_BEFORE_CREATE_PROCESSED_'
const X_DESYNC = '_VBS_DESYNC_'
const X_PROP_CHANGED_BY_PARENT = 1
const X_PROP_CHANGED_BY_PROXY = 2

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
      const beforeSyncMethod = `beforeSync${PropName}`
      const beforeProxyMethod = `beforeProxy${PropName}`

      ctx[X_PROXY_PROPS].push(proxy)

      ctx.methods[directSyncMethod] = function (newValue, oldValue, propChangedBy) {
        if (oldValue !== newValue) {
          if (propChangedBy !== X_PROP_CHANGED_BY_PROXY) {
            this[proxy] = newValue
          }
          if (propChangedBy !== X_PROP_CHANGED_BY_PARENT) {
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
            const confirm = (_newValue = newValue) => {
              if (_newValue !== newValue) {
                this[X_DESYNC] = true
              }
              this[directSyncMethod](_newValue, oldValue, X_PROP_CHANGED_BY_PARENT)
            }
            const cancel = () => {}
            if (typeof this[beforeProxyMethod] === 'function') {
              this[beforeProxyMethod](oldValue, newValue, confirm, cancel)
            } else {
              confirm()
            }
          }
        }
      }

      ctx.watch[proxy] = function (newValue, oldValue) {
        if (this[X_DESYNC]) {
          this[X_DESYNC] = false
          return
        }

        // now: this[proxy] === newValue
        if (newValue !== oldValue && newValue !== this[propName]) {
          // so: `this[proxy] = newValue` will not trigger watcher
          const confirm = (_newValue = newValue) => {
            this[directSyncMethod](_newValue, oldValue, X_PROP_CHANGED_BY_PROXY)
          }
          const cancel = () => {
            this[proxy] = oldValue
          }
          if (typeof this[beforeSyncMethod] === 'function') {
            this[beforeSyncMethod](oldValue, newValue, confirm, cancel)
          } else {
            confirm()
          }
        }
      }
    })
  }
})
