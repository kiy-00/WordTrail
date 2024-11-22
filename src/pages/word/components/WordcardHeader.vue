<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    currentCard: { type: Number, default: 0 },
    totalCards: { type: Number, default: 10 },
    word: { type: String, required: true },
  },
  data() {
    return {
      isCollected: false,
    }
  },
  methods: {
    onBack(): void {
      uni.navigateTo({
        url: '/pages/home/home',
      })
    },
    async onCollect(): Promise<void> {
      if (!this.isCollected) {
        // 假设后端有一个收藏单词的 API，替换为实际的接口
        setTimeout(() => {
          this.isCollected = !this.isCollected // 切换状态
          uni.showToast({
            title: '成功收藏该生词',
            icon: 'success',
            duration: 2000,
          })
        }, 500) // 模拟延迟
      }
      else {
        // 假设后端有一个取消收藏单词的 API，替换为实际的接口
        setTimeout(() => {
          this.isCollected = !this.isCollected // 切换状态
          uni.showToast({
            title: '成功移出生词本',
            icon: 'success',
            duration: 2000,
          })
        }, 500) // 模拟延迟
      }
    },
    async onMarkAsKnown(): Promise<void> {
      // 假设后端有一个标熟单词的 API，替换为实际的接口
      setTimeout(() => {
        uni.showToast({
          title: '成功标熟该生词',
          icon: 'success',
          duration: 2000,
        })
      }, 500) // 模拟延迟
    },
    onMoreInfo(): void {
      uni.showActionSheet({
        itemList: ['操作1', '操作2', '操作3'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              uni.showToast({ title: '成功进行操作1', icon: 'success' })
              break
            case 1:
              uni.showToast({ title: '成功进行操作2', icon: 'success' })
              break
            case 2:
              uni.showToast({ title: '成功进行操作3', icon: 'success' })
              break
          }
        },
        fail: () => {
          uni.showToast({ title: '取消操作', icon: 'none' })
        },
      })
    },
  },
})
</script>

<template>
  <view class="h-[10vh] w-full flex items-center justify-between text-white">
    <view class="ml-5 flex items-center gap-4">
      <view class="flex cursor-pointer items-center justify-center" @click="onBack">
        <view class="i-mynaui:arrow-left text-2xl" style: color="text-white" />
      </view>
      <text class="text-lg text-white font-sans">
        {{ currentCard }} / {{ totalCards }}
      </text>
    </view>

    <view class="mr-5 flex items-center gap-4">
      <view class="flex cursor-pointer items-center justify-center" @click="onCollect">
        <view :class="isCollected ? 'i-mynaui:star-solid' : 'i-mynaui:star'" class="text-2xl" style="color:text-white;" />
      </view>
      <view class="flex cursor-pointer items-center justify-center" @click="onMarkAsKnown">
        <view class="i-mynaui:trash text-2xl" style: color="text-white" />
      </view>
      <view class="flex cursor-pointer items-center justify-center" @click="onMoreInfo">
        <view class="i-mynaui:dots text-2xl" style: color="text-white" />
      </view>
    </view>
  </view>
</template>
