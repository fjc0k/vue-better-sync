/* eslint-disable no-template-curly-in-string */

import { mount } from '@vue/test-utils'
import { Prompt, Prompt2, Prompt3 } from './components'

const DEFAULT_VALUE = '123'
const DEFAULT_VISIBLE = false

const genComponent = (template, _Prompt) => ({
  name: 'wrapper',
  data() {
    return {
      value: DEFAULT_VALUE,
      visible: DEFAULT_VISIBLE
    }
  },
  components: {
    Prompt: _Prompt
  },
  template
})

const wrap = (template, _Prompt = Prompt) => {
  const wrapper = mount(genComponent(template, _Prompt))
  const prompt = wrapper.find(_Prompt)
  const input = prompt.find('input')
  return {
    wrapper,
    prompt,
    input
  }
}

it('uses prop value to create a child data prop: `actual${Prop}`', () => {
  const value = 'custom'
  const { prompt } = wrap(`<Prompt value="${value}" />`)
  expect(prompt.vm.actualValue).toBe(value)
  expect(prompt.vm.actualVisible).toBe(Prompt.props.visible.default)
})

it('two-way binding by `.sync`', () => {
  const oldValue = DEFAULT_VISIBLE
  const { wrapper, prompt } = wrap(`<Prompt :visible.sync="visible" />`)
  expect(wrapper.vm.visible).toBe(oldValue)
  expect(prompt.vm.actualVisible).toBe(oldValue)

  const newValue = !oldValue
  prompt.trigger('click')
  expect(prompt.vm.actualVisible).toBe(newValue)
  expect(prompt.emitted()['update:visible'].length).toBe(1)
  expect(prompt.emitted()['update:visible'][0]).toEqual([newValue, oldValue])
  expect(wrapper.vm.visible).toBe(newValue)
})

it('two-way binding by `v-model`', () => {
  const oldValue = DEFAULT_VALUE
  const { wrapper, prompt, input } = wrap(`<Prompt v-model="value" />`)
  expect(wrapper.vm.value).toBe(oldValue)
  expect(prompt.vm.actualValue).toBe(oldValue)
  expect(input.element.value).toBe(oldValue)

  const newValue = 'world'
  input.element.value = newValue
  input.trigger('input')
  expect(input.element.value).toBe(newValue)
  expect(prompt.vm.actualValue).toBe(newValue)
  expect(prompt.emitted().input.length).toBe(1)
  expect(prompt.emitted().input[0]).toEqual([newValue, oldValue])
  expect(wrapper.vm.value).toBe(newValue)
})

it('two-way binding: down', () => {
  const oldValue = DEFAULT_VALUE
  const { wrapper, prompt } = wrap(`<Prompt v-model="value" />`)
  expect(wrapper.vm.value).toBe(oldValue)
  expect(prompt.vm.actualValue).toBe(oldValue)

  const newValue = 'world'
  wrapper.setData({ value: newValue })
  expect(prompt.vm.actualValue).toBe(newValue)
})

it('two-way binding by `v-model` or `.sync`', () => {
  const oldValue = DEFAULT_VALUE
  const { wrapper, prompt, input } = wrap(`<Prompt :value.sync="value" />`)
  expect(wrapper.vm.value).toBe(oldValue)
  expect(prompt.vm.actualValue).toBe(oldValue)
  expect(input.element.value).toBe(oldValue)

  const newValue = 'world'
  input.element.value = newValue
  input.trigger('input')
  expect(input.element.value).toBe(newValue)
  expect(prompt.vm.actualValue).toBe(newValue)
  expect(prompt.emitted()['update:value'].length).toBe(1)
  expect(prompt.emitted()['update:value'][0]).toEqual([newValue, oldValue])
  expect(wrapper.vm.value).toBe(newValue)
})

it('two-way binding by `v-model` with custom `event`', () => {
  const event = 'change'
  const oldValue = DEFAULT_VALUE
  const { wrapper, prompt, input } = wrap(`<Prompt v-model="value" />`, Prompt2)
  expect(wrapper.vm.value).toBe(oldValue)
  expect(prompt.vm.actualValue).toBe(oldValue)
  expect(input.element.value).toBe(oldValue)

  const newValue = 'world'
  input.element.value = newValue
  input.trigger('input')
  expect(input.element.value).toBe(newValue)
  expect(prompt.vm.actualValue).toBe(newValue)
  expect(prompt.emitted()[event].length).toBe(1)
  expect(prompt.emitted()[event][0]).toEqual([newValue, oldValue])
  expect(wrapper.vm.value).toBe(newValue)
})

it('two-way binding with `transform${PropName}`', () => {
  const oldValue = DEFAULT_VALUE
  const { wrapper, prompt, input } = wrap(`<Prompt v-model="value" />`, Prompt3)
  expect(wrapper.vm.value).toBe(oldValue)
  expect(prompt.vm.actualValue).toBe('_' + oldValue)
  expect(prompt.emitted().input).toBe(undefined)

  const newValue = '=-='
  input.element.value = newValue
  input.trigger('input')
  expect(prompt.vm.actualValue).toBe(newValue)
  expect(prompt.emitted().input[0]).toEqual([newValue + '_', '_' + oldValue + '_'])
  expect(wrapper.vm.value).toBe(newValue + '_')
})
