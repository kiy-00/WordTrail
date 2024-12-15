<script lang="ts">
import type { Word } from '@/types/Word'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      words: [] as Word[],
      currentIndex: 0,
      showContent: false,
      waitingTime: 10,
      timer: null as number | null,
    }
  },

  // 修改 onLoad 钩子的实现，正确处理类型
  onLoad() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1] as any // 获取当前页面
    if (currentPage.$getAppWebview) {
      const eventChannel = currentPage.$getAppWebview().eventChannel
      // 监听acceptWords事件，获取上一页面传送到当前页面的数据
      eventChannel.on('acceptWords', (data: { words: Word[] }) => {
        this.words = data.words
        this.startWaiting()
      })
    }
  },

  computed: {
    currentWord(): Word | undefined {
      return this.words[this.currentIndex]
    },
    currentCard() {
      return this.currentIndex + 1 // 显示从1开始
    },
    totalCards() {
      return this.words.length // 总单词数
    },
  },

  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  methods: {
    startWaiting() {
      this.showContent = false
      this.waitingTime = 10
      this.timer = setInterval(() => {
        if (this.waitingTime > 0) {
          this.waitingTime--
        }
        else {
          this.showContent = true
          if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
          }
        }
      }, 1000)
    },

    onNextWord(): void {
      if (this.currentIndex < this.words.length - 1) {
        this.currentIndex++
        this.startWaiting() // 重新开始等待
      }
      else {
        uni.showToast({
          title: '您已经完成了本轮学习!',
          icon: 'none',
          duration: 2000,
        })
        this.currentIndex = 0
        uni.navigateTo({
          url: '/pages/home/home',
        })
      }
    },
    onForgot(): void {
      uni.showToast({
        title: '记错了！',
        icon: 'none',
        duration: 2000,
      })
    },
  },
})
</script>

<template>
  <!-- Wordcard Header -->
  <WordCardsHeader
    :current-card="currentCard"
    :total-cards="totalCards"
    :word="currentWord?.word || ''"
  />

  <!-- 根据showContent状态显示等待组件或单词内容 -->
  <template v-if="!showContent">
    <WaitingCard :remaining-time="waitingTime" />
  </template>
  <template v-else>
    <WordCardContent v-if="currentWord" :word-data="currentWord" />
  </template>

  <!-- Wordcard Footer -->
  <view class="flex items-center justify-around py-7">
    <!-- Next Word Button -->
    <view class="flex flex-col cursor-pointer items-center" @click="onNextWord">
      <text class="text-base font-sans">
        下一词
      </text>
      <view class="mt-1 h-1 w-5 rounded bg-[#4caf50]" />
    </view>

    <!-- Forgot Button -->
    <view class="flex flex-col cursor-pointer items-center" @click="onForgot">
      <text class="text-base font-sans">
        记错了
      </text>
      <view class="mt-1 h-1 w-5 rounded bg-[#f44336]" />
    </view>
  </view>
</template>

<style scoped>
</style>

<route lang="json">
  {
    "layout": "default"
  }
</route>
