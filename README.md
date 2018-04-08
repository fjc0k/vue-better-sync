# vue-better-sync

Simply sync values.


## Install

```shell
yarn add vue-better-sync
```
CDN:
[UNPKG](https://unpkg.com/vue-better-sync)
|
[jsDelivr](https://cdn.jsdelivr.net/npm/vue-better-sync)
(available as `window.VueBetterSync`)


## Usage

Inside your Vue components:

```html
<template>
  <input
    v-model="localValue"
    @input="handleInput"
  />
</template>
<script>
  import VueBetterSync from 'vue-better-sync'

  export default {
    mixins: [
      VueBetterSync({
        prop: 'value', // v-model prop
        event: 'input' // v-model event
      })
    ],

    props: {
      value: String
    },

    methods: {
      handleInput(e) {
        this.syncValue(e.target.value) // sync value
      }
    }
  }
</script>
```html
