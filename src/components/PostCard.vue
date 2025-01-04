<script setup lang="ts">
import type { Post } from '@/types/Post'
import { defineEmits, ref } from 'vue'
// import axios from 'axios' // 移除 axios 导入

interface Props {
  post: Post
  isMyPost?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isMyPost: false,
})

const emit = defineEmits<{
  (e: 'delete', id: number): void
}>()

const isLiked = ref(false)
const likes = ref(props.post.likes)

function navigateToDetail() {
  uni.navigateTo({
    url: `/pages/community/post?id=${props.post.id}`, // 直接使用 props.post.id
  })
}

function toggleLike() {
  if (isLiked.value) {
    likes.value -= 1
    isLiked.value = false
  }
  else {
    likes.value += 1
    isLiked.value = true
  }
  // 如果需要通知父组件，可以取消注释以下行
  // emit('update:likes', likes.value)
}

function deletePost() {
  emit('delete', props.post.id)
}
</script>

<template>
  <view
    class="post-card mb-1 rounded-lg p-2 frosted-glass"
    @click="navigateToDetail"
  >
    <!-- 删除按钮，直接使用 props.isMyPost -->
    <view
      v-if="props.isMyPost"
      class="absolute right-1 top-2 z-10 h-6 w-6 flex cursor-pointer items-center justify-center rounded-full bg-red-500 text-white"
      @click.stop="deletePost"
    >
      <view class="i-mynaui:trash text-sm" />
    </view>

    <!-- 帖子内容 -->
    <view class="post-content mb-2">
      <!-- 显示第一张图片 -->
      <image
        v-if="post.images && post.images.length > 0"
        :src="post.images[0]"
        class="post-image mt-2 h-40 w-full rounded-lg object-cover"
      />
      <!-- 添加标题 -->
      <text class="title mt-2 text-base">
        {{ post.title }}
      </text>
    </view>

    <!-- 发帖信息 -->
    <view class="post-info mb-4 flex items-center">
      <image :src="post.userAvatar" class="avatar h-10 w-10 rounded-full" />
      <view class="user-info ml-3 flex flex-col items-start">
        <text class="username text-sm">
          {{ post.username }}
        </text>
        <text class="publish-time text-sm">
          {{ post.publishTime }}
        </text>
      </view>
    </view>

    <!-- 帖子底部 -->
    <view class="post-footer flex items-center justify-between">
      <!-- 点赞部分 -->
      <view class="flex items-center">
        <view
          class="cursor-pointer text-xl"
          :class="isLiked ? 'i-mynaui:heart-solid text-red' : 'i-mynaui:heart'"
          @click.stop="toggleLike"
        />
        <text class="likes ml-1 text-sm">
          {{ likes }}
        </text>
      </view>
      <!-- 仅在“我的”帖子中显示状态 -->
      <view v-if="props.isMyPost && post.status" class="text-xs">
        {{ post.status }}
      </view>
    </view>
  </view>
</template>

<style scoped>
/* UnoCSS 处理所有样式使用实用类 */
</style>
