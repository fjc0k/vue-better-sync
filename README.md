# vue-better-sync

Make it easier for props to enable two-way binding by `v-model` or `.sync`.

## Install

```shell
yarn add vue-better-sync
```
CDN:
[UNPKG](https://unpkg.com/vue-better-sync/)
|
[jsDelivr](https://cdn.jsdelivr.net/npm/vue-better-sync/)
(available as `window.VueBetterSync`)


## Usage

`prompt.vue`:
```html
<template>
  <div
    v-show="actualVisible"
    @click.self="syncVisible(!actualVisible)">
    <input v-model="actualValue"></input>
  </div>
</template>

<script>
import VueBetterSync from 'vue-better-sync'
export default {
  name: 'prompt',
  mixins: [
    VueBetterSync({
      prop: 'text', // model prop, default: value
      event: 'change' // model event, default: input
    })
  ],
  props: {
    text: String,
    visible: {
      type: Boolean,
      sync: true // an .sync prop?
    }
  }
}
</script>
```

`main.vue`:
```html
<template>
  <div>
    {{ text }} | {{ visible }}<hr />
    <prompt
      v-model="text"
      :visible.sync="visible"
    ></prompt>
  </div>
</template>

<script>
import prompt from './prompt.vue'
export default {
  name: 'main',
  components: { prompt },
  data: () => ({
    text: 'hello',
    visible: true
  })
}
</script>
```
