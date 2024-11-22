<!-- PostHeader.vue -->
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PostHeader',
  props: {
    userAvatar: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  emits: {
    back: () => true,
    share: () => true,
  },
  setup(props, { emit }) {
    const onBack = () => {
      emit('back')
    }

    const onShare = () => {
      emit('share')
    }

    return {
      onBack,
      onShare,
    }
  },
})
</script>

<template>
  <view class="fixed left-0 right-0 top-0 z-50 h-12 flex items-center justify-between border-b px-4 frosted-glass">
    <!-- 左侧返回按钮 -->
    <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="onBack">
      <view class="i-mynaui:arrow-left text-2xl" aria-label="返回" />
    </view>

    <!-- 用户信息 -->
    <view class="flex items-center">
      <image :src="userAvatar" class="h-8 w-8 rounded-full object-cover" />
      <text class="ml-2 align-text-bottom text-sm font-500">
        {{ username }}
      </text>
    </view>

    <!-- 右侧分享按钮 -->
    <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="onShare">
      <view class="i-mynaui:share text-2xl" aria-label="分享" />
    </view>
  </view>
</template>

<style scoped>
/* UnoCSS handles all styling using utility classes */
</style>
