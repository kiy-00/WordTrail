<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'WaitingCard',
  props: {
    remainingTime: {
      type: Number,
      required: true,
    },
  },
  computed: {
    emoji() {
      const emojis = ['🤔', '🧐', '🤓', '📚', '💭']
      return emojis[Math.floor(this.remainingTime / 2) % emojis.length]
    },
    message() {
      const messages = [
        '让我们先思考一下...',
        '记忆需要一点时间...',
        '给大脑一点准备时间...',
        '马上就能看到答案啦...',
      ]
      return messages[Math.floor(this.remainingTime / 3) % messages.length]
    },
  },
})
</script>

<template>
  <view class="flex flex-col items-center justify-center p-8">
    <text class="mb-4 text-6xl">
      {{ emoji }}
    </text>
    <text class="mb-4 text-xl">
      {{ message }}
    </text>
    <text class="text-lg text-gray-600">
      {{ remainingTime }} 秒后显示答案
    </text>
  </view>
</template>
