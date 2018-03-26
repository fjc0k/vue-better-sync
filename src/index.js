import { camelCase } from './utils'

const X_DATA_PROPS = '_VBS_DATA_PROPS_'
const X_DATA_PROCESSED = '_VBS_DATA_PROCESSED_'
const X_BEFORE_CREATE_PROCESSED = '_VBS_BEFORE_CREATE_PROCESSED_'
const X_PROP_CHANGED_BY_PARENT = 1
const X_PROP_CHANGED_BY_PROXY = 2

export default ({
  prop = 'value',
  event = 'input'
} = {}) => ({
  model: { prop, event },

  data() {
    const ctx = this.$options

    if (this[X_DATA_PROCESSED] || !ctx[X_DATA_PROPS]) return

    this[X_DATA_PROCESSED] = true
    const props = ctx[X_DATA_PROPS]

    return Object.keys(props).reduce((data, proxy) => {
      data[proxy] = this[props[proxy]]
      return data
    }, {})
  },

  beforeCreate() {
    const ctx = this.$options

    if (this[X_BEFORE_CREATE_PROCESSED] || !ctx.props) return

    this[X_BEFORE_CREATE_PROCESSED] = true
    ctx[X_DATA_PROPS] = {}
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

      ctx[X_DATA_PROPS][proxy] = propName

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
        this[proxy] = newValue
      }

      ctx.watch[propName] = function (newValue, oldValue) {
        if (newValue !== oldValue) {
          this[directSyncMethod](newValue, oldValue, X_PROP_CHANGED_BY_PARENT)
        }
      }

      ctx.watch[proxy] = function (newValue, oldValue) {
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
