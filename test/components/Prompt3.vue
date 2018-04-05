<template>
  <div v-show="localVisible" @click="handleClick">
    <input v-model="localValue" type="text" />
  </div>
</template>

<script>
import vueBetterSync from '../../src'

export default {
  name: 'prompt3',

  mixins: [
    vueBetterSync()
  ],

  props: {
    visible: {
      type: Boolean,
      default: true,
      sync: true
    },
    value: {
      type: String,
      sync: true
    }
  },

  methods: {
    handleClick() {
      this.syncVisible(!this.localVisible)
    },
    transformValue(_, fromProp) {
      _.newValue += fromProp ? '_' : '-'
      return _
    }
  }
}
</script>
