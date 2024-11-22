<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BoxItem',
  props: {
    url: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number],
      required: true,
    },
  },
})
</script>

<template>
  <view class="mb-4 rounded bg-coolgray px-4 py-2">
    <navigator :url="url" class="cursor-pointer">
      <view :class="icon" />
      <text class="link-text">
        {{ text }}
      </text>
      <text class="link-text-right">
        {{ value }}
      </text>
      <view class="i-mynaui:chevron-right" />
    </navigator>
  </view>
</template>

<style scoped>
</style>
