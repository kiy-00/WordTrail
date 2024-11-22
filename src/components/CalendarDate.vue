<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  dayOfWeek: string
  date: string
  isToday: boolean
}>()
</script>

<template>
  <view class="flex flex-col items-center rounded-md bg-transparent">
    <text class="day-of-week mb-2" :color="isToday ? 'yellow' : ''">
      {{ dayOfWeek }}
    </text>
    <view v-if="isToday" class="mt--1 h-5 w-5 flex items-center justify-center rounded-full bg-yellow">
      <text class="text-white">
        今
      </text>
    </view>
    <text v-else class="date-text text-md mt-0">
      {{ date }}
    </text>
  </view>
</template>

<style scoped>
</style>
