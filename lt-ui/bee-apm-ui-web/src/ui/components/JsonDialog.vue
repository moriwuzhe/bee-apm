<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title: string
  text: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()
</script>

<template>
  <el-dialog :model-value="modelValue" :title="title" width="72%" @update:model-value="(v:boolean)=>emit('update:modelValue', v)">
    <el-input :model-value="text" type="textarea" :rows="22" readonly />
  </el-dialog>
</template>

