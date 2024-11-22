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
  methods: {
    navigate() {
      uni.navigateTo({ url: this.url })
    },
  },
})
</script>

<template>
  <view class="mb-4 rounded-lg px-4 py-4 frosted-glass">
    <view class="flex flex-row cursor-pointer items-center justify-between" @click="navigate">
      <view class="flex flex-row items-center">
        <view :class="icon" class="mr-3" />
        <text class="flex-1">
          {{ text }}
        </text>
      </view>
      <view class="i-mynaui:chevron-right" />
    </view>
  </view>
</template>

<style scoped>
</style>
