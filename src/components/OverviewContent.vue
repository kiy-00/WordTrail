<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  icon: string
  content: string
  data: string
  unit: string
  color: string
}>()
</script>

<template>
  <view class="box flex flex-col items-start">
    <view class="flex items-center">
      <view :class="icon" :color="color" />
      <text class="ml-2 whitespace-nowrap text-xs">
        {{ content }}
      </text>
    </view>
    <view class="sub-box ml-8 mt-1">
      <view class="flex items-baseline">
        <text class="text-xl">
          {{ data }}
        </text>
        <text class="ml-1 whitespace-nowrap text-xs">
          &nbsp;&nbsp;{{ unit }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.box {
  background-color: transparent; /* Make the box transparent */
}
</style>
