<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  dayOfWeek: string
  date: string
  isToday: boolean
}>()
</script>

<template>
  <view class="box flex flex-col items-center rounded-md bg-transparent">
    <text class="day-of-week mb-2" :color="isToday ? 'yellow' : '#706C6CFF'">
      {{ dayOfWeek }}
    </text>
    <view v-if="isToday" class="today-indicator mt-0 flex items-center justify-center rounded-full bg-yellow">
      <text class="today-text" color-white>
        今
      </text>
    </view>
    <text v-else class="date-text text-md mt-0 color-white">
      {{ date }}
    </text>
  </view>
</template>

<style scoped>
.day-of-week {
  font-size: 3vw; /* Responsive font size */
}

.today-indicator {
  width: 6vw; /* Responsive size */
  height: 6vw; /* Responsive size */
}

.today-text {
  font-size: 4vw; /* Responsive font size */
}

.date-text {
  font-size: 5vw; /* Responsive font size */
}
</style>
