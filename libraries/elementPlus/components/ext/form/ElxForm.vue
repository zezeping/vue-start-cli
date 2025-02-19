<template>
  <el-form ref="formRef" class="elx-form" :model="formModel" v-bind="{ ...$attrs, ...formAttrs }">
    <slot v-bind="{...$attrs , config, formModel, setFormModel, onSubmit, onReset, onCancel}">
      <template v-for="(formItem, idx) in config.formItems" :key="idx">
        <slot :name="`${formItem.prop}FormItem`" v-bind="{ formItemAttrs: formItemAttrs(formItem), formModel, formItem, onSubmit, onReset, onCancel }">
          <el-form-item v-if="slotKeys.indexOf(`${formItem.name}FormItem`) === -1" v-bind="formItemAttrs(formItem)">
            <slot :name="formItem.prop" v-bind="{ formItem, formModel, onSubmit, onReset, onCancel }">
              <component :is="formItem.type" v-model="formItem.value" v-bind="formItem.attrs"></component>
            </slot>
          </el-form-item>
        </slot>
      </template>
    </slot>
    <slot name="operationsFormItem" v-bind="{ config, formModel, onSubmit, onReset, onCancel, submitLoading }">
      <el-form-item v-if="slotKeys.indexOf(`operationsFormItem`) === -1" class="operations-form-item" v-bind="config.operationsFormItem">
        <slot name="operations" v-bind="{ config, formModel, onSubmit, onReset, onCancel, submitLoading }">
          <el-button type="primary" @click="onSubmit" :loading="submitLoading.value">提交</el-button>
          <el-button @click="onCancel">取消</el-button>
          <el-button @click="onReset">重置</el-button>
        </slot>
      </el-form-item>
    </slot>
  </el-form>
</template>

<script>
import { reactive, toRefs, defineComponent, computed, nextTick } from 'vue'
import { ElInput, ElSelect, ElCheckbox } from 'element-plus'
import { useOmitKeys } from '@/utils/hooks/useObject'
import { useLoading } from '@/utils/hooks/useLoading'
import ElxSelect from './ElxSelect'
import ElxCheckboxGroup from './ElxCheckboxGroup'
export default defineComponent({
  name: 'ElxForm',
  components: {
    ElInput,
    ElSelect,
    ElCheckbox,
    ElxSelect,
    ElxCheckboxGroup,
  },
  inheritAttrs: false,
  props: {
    // keys: model, formItems
    config: {
      type: Object,
      required: true
    }
  },
  emits: ['submit', 'reset', 'cancel'],
  setup(props, ctx) {
    const omitKeys = useOmitKeys()
    const state = reactive({
      submitLoading: useLoading(),
      slotKeys: computed(() => Object.keys(ctx.slots)),
      formAttrs: computed(() => omitKeys.value(props.config, ['model', 'formItems'])),
      formItemAttrs: computed(() => (formItem) => omitKeys.value(formItem, ['type', 'attrs', 'value'])),
      formRef: null,
      defaultFormModel: null,
      validate: () => state.formRef.validate(),
      formModel: computed(() => {
        if (ctx.attrs.model) {
          return ctx.attrs.model
        }
        const form = { ...state.defaultFormModel, ...props.config.model }
        for (const formItem of (props.config.formItems || [])) {
          form[formItem.prop] = typeof formItem.getValue === 'function' ? formItem.getValue(formItem, form) : formItem.value
        }
        return form
      }),
      setFormModel(formModel) {
        for (const formItem of (props.config.formItems || [])) {
          if (typeof formItem.setValue === 'function') {
            formItem.setValue(formItem, formModel)
          } else if (Object.prototype.hasOwnProperty.call(formModel, formItem.prop)) {
            formItem.value = formModel[formItem.prop]
          }
        }
      },
      setDefaultFormModel(defaultFormModel) {
        state.setFormModel(defaultFormModel)
        state.defaultFormModel = defaultFormModel
      }
    })
    state.setDefaultFormModel(state.formModel)

    const onCancel = () => ctx.emit('cancel')
    return {
      ...toRefs(state),
      omitKeys: useOmitKeys(),
      onSubmit() {
        state.formRef.validate((valid) => {
          if (valid) {
            ctx.emit('submit', {...state.formModel}, { submitLoading: state.submitLoading, onCancel })
          }
        })
      },
      onReset() {
        // state.formRef.resetFields()
        nextTick(() => {
          state.setFormModel(state.defaultFormModel)
          ctx.emit('reset', {...state.formModel})
        })
      },
      onCancel
    }
  }
})
</script>