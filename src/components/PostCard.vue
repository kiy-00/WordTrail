<script lang="ts">
import type { Post } from '@/types/Post.ts'
import type { PropType } from 'vue'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'PostCard',

  props: {
    post: {
      type: Object as PropType<Post>,
      required: true,
    },
    isMyPost: { // 新增 prop 用于判断是否为“我的”帖子
      type: Boolean,
      default: false,
    },
  },
  emits: ['delete'],
  setup(props, { emit }) {
    const isLiked = ref(false)
    const likes = ref(props.post.likes)

    const navigateToDetail = () => {
      uni.navigateTo({
        url: `/pages/community/post?id=${props.post.id}`,
      })
    }

    const toggleLike = () => {
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

    const deletePost = () => {
      emit('delete', props.post.id)
    }

    return {
      navigateToDetail,
      isLiked,
      likes,
      toggleLike,
      deletePost,
      isMyPost: props.isMyPost,
    }
  },
})
</script>

<template>
  <view
    class="post-card relative mb-1 border border-gray-300 rounded-lg bg-white p-2"
    @click="navigateToDetail"
  >
    <!-- 删除按钮，仅在“我的”帖子中显示 -->
    <view
      v-if="isMyPost"
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
      <text class="title mt-2 text-base text-gray-600 font-500">
        {{ post.title }}
      </text>
    </view>

    <!-- 发帖信息 -->
    <view class="post-info mb-4 flex items-center">
      <image :src="post.userAvatar" class="avatar h-10 w-10 rounded-full" />
      <view class="user-info ml-3 flex flex-col items-start">
        <text class="username text-sm text-gray-600">
          {{ post.username }}
        </text>
        <text class="publish-time text-sm text-gray-500">
          {{ post.publishTime }}
        </text>
      </view>
    </view>

    <!-- 帖子底部 -->
    <view class="post-footer flex items-center justify-between">
      <!-- 点赞部分 -->
      <view class="flex items-center">
        <view
          class="cursor-pointer text-xl text-red"
          :class="isLiked ? 'i-mynaui:heart-solid' : 'i-mynaui:heart'"
          @click.stop="toggleLike"
        />
        <text class="likes ml-1 text-sm" :class="isLiked ? 'text-red' : 'text-gray-500'">
          {{ likes }}
        </text>
      </view>
      <!-- 仅在“我的”帖子中显示状态 -->
      <view v-if="isMyPost && post.status" class="text-xs text-gray-600">
        {{ post.status }}
      </view>
    </view>
  </view>
</template>

<style scoped>
</style>
