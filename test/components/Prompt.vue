<template>
  <div v-show="actualVisible" @click="handleClick">
    <input v-model="actualValue" type="text" />
  </div>
</template>

<script>
import vueBetterSync from '../../src'

export default {
  name: 'prompt',

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
    }
  }
}
</script>
