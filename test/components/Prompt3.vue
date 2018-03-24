<template>
  <div v-show="actualVisible" @click="handleClick">
    <input v-model="actualValue" type="text" />
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
      this.syncVisible(!this.actualVisible)
    },
    beforeSyncValue(oldValue, newValue, confirm, cancel) {
      if (newValue === oldValue + '_desync') {
        cancel()
      } else {
        confirm()
      }
    },
    beforeSyncVisible(oldValue, newValue, confirm) {
      setTimeout(confirm, 1000)
    }
  }
}
</script>
