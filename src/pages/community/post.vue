<!-- Post.vue -->
<script lang="ts">
import type { Comment, Post } from '@/types/Post'
import { defineComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'Post',

  setup() {
    const route = useRoute()
    const postId = Number.parseInt(route.params.id as string, 10)

    // 模拟获取帖子数据
    const post = ref<Post>({
      id: postId,
      userAvatar: 'https://via.placeholder.com/40',
      username: '张三',
      images: [
        'https://via.placeholder.com/600x400?text=Image+1',
        'https://via.placeholder.com/600x400?text=Image+2',
        'https://via.placeholder.com/600x400?text=Image+3',
      ],
      title: '这是帖子标题',
      content: '这是帖子的详细内容，描述帖子相关的信息和讨论点。',
      publishTime: '2023-10-04',
      tags: ['标签1', '标签2'],
      likes: Math.floor(Math.random() * 100), // 确保 likes 是 number 类型
      collects: Math.floor(Math.random() * 100), // 确保 collects 是 number 类型
    })

    const currentImage = ref(0)
    const newComment = ref('')
    const comments = ref<Comment[]>([
      {
        id: 1,
        username: '用户A',
        avatar: 'https://via.placeholder.com/40',
        content: '这是一个评论示例。',
        publishTime: '2023-10-05',
        likes: 5,
        dislikes: 0,
        replies: [
          {
            id: 3,
            username: '用户C',
            avatar: 'https://via.placeholder.com/30',
            content: '这是对用户A的回复。',
            publishTime: '2023-10-06',
            likes: 2,
            dislikes: 0,
            replies: [],
          },
        ],
      },
      {
        id: 2,
        username: '用户B',
        avatar: 'https://via.placeholder.com/40',
        content: '这是另一个评论示例。',
        publishTime: '2023-10-06',
        likes: 3,
        dislikes: 1,
        replies: [],
      },
      // 更多评论...
    ])

    // 悬浮模块状态
    const isCollected = ref(false)
    const isLiked = ref(false)
    const likeCount = ref(post.value.likes)
    const collectCount = ref(post.value.collects)
    // 举报弹窗状态
    const showReportModal = ref(false)
    const reportReason = ref('')

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateBack()
    }

    const handleShare = () => {
      // 实现分享逻辑
    }

    const onImageChange = (e: any) => {
      currentImage.value = e.detail.current
    }

    const submitComment = () => {
      if (newComment.value.trim()) {
        const newEntry: Comment = {
          id: comments.value.length + 1,
          username: '新用户',
          avatar: 'https://via.placeholder.com/40',
          content: newComment.value.trim(),
          publishTime: new Date().toISOString().split('T')[0],
          likes: 0,
          dislikes: 0,
          replies: [],
        }
        comments.value.push(newEntry)
        newComment.value = ''
      }
    }

    // 收藏逻辑
    const toggleCollect = () => {
      isCollected.value = !isCollected.value
      if (isCollected.value) {
        // 执行收藏操作，例如发送 API 请求

      }
      else {
        // 取消收藏操作

      }
    }

    // 点赞逻辑
    const toggleLike = () => {
      if (isLiked.value) {
        likeCount.value -= 1
        isLiked.value = false
        // 取消点赞操作，例如发送 API 请求
      }
      else {
        likeCount.value += 1
        isLiked.value = true
        // 执行点赞操作，例如发送 API 请求
      }
    }

    // 举报逻辑
    const reportPost = () => {
      // 实现举报逻辑，将弹出举报理由的文本框
      showReportModal.value = true
    }

    // 提交举报
    const submitReport = () => {
      if (reportReason.value.trim()) {
        // 这里可以发送举报请求到服务器
        showReportModal.value = false
        uni.showToast({
          title: '已举报',
          icon: 'none',
        })
        // 清空举报理由
        reportReason.value = ''
      }
      else {
        uni.showToast({
          title: '请输入举报理由',
          icon: 'none',
        })
      }
    }

    // 取消举报
    const cancelReport = () => {
      showReportModal.value = false
      reportReason.value = ''
    }

    onMounted(() => {
      // 这里可以根据 postId 从 API 获取帖子详情
    })

    return {
      post,
      handleBack,
      handleShare,
      currentImage,
      comments,
      newComment,
      onImageChange,
      submitComment,
      toggleCollect,
      toggleLike,
      reportPost,
      isCollected,
      isLiked,
      likeCount,
      collectCount,
      showReportModal,
      reportReason,
      submitReport,
      cancelReport,
    }
  },
})
</script>

<template>
  <view class="min-h-screen flex flex-col bg-gray-100">
    <!-- Post Header -->
    <PostHeader
      :user-avatar="post.userAvatar"
      :username="post.username"
      @back="handleBack"
      @share="handleShare"
    />

    <!-- Image Carousel -->
    <view class="relative mt-12">
      <swiper
        :indicator-dots="false"
        :current="currentImage"
        class="h-64"
        @change="onImageChange"
      >
        <swiper-item v-for="(image, index) in post.images" :key="index">
          <image
            :src="image"
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </swiper-item>
      </swiper>

      <!-- Image Indicators -->
      <view class="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
        <view
          v-for="(image, index) in post.images"
          :key="index"
          class="h-2 w-2 rounded-full"
          :class="currentImage === index ? 'bg-red' : 'bg-gray-300'"
        />
      </view>
    </view>

    <!-- Post Content -->
    <view class="flex flex-col items-start p-4">
      <text class="text-xl text-gray-800 font-500">
        {{ post.title }}
      </text>
      <text class="mt-2 text-left text-gray-700">
        {{ post.content }}
      </text>
      <text class="mt-4 text-sm text-gray-500">
        {{ post.publishTime }}
      </text>
      <!-- 标签模块 -->
      <view class="mt-2 flex flex-wrap">
        <view
          v-for="(tag, index) in post.tags"
          :key="index"
          class="mr-2"
        >
          <text class="rounded-md bg-gray-200 px-2 py-1 text-sm text-gray-500">
            {{ tag }}
          </text>
        </view>
      </view>
    </view>

    <!-- Comment Input -->
    <view class="flex items-center bg-transparent p-2">
      <input
        v-model="newComment"
        type="text"
        placeholder="发表评论..."
        class="w-full border-gray-300 rounded-lg border-solid px-3 py-2 text-left text-gray-500 focus:border-red focus:outline-none"
        @keydown.enter="submitComment"
      >
      <view class="i-mynaui:message-reply m-1 cursor-pointer text-2xl text-red-3" @click="submitComment" />
    </view>

    <!-- Comment Field -->
    <view class="flex-1 overflow-y-auto p-1">
      <Comments
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
      />
    </view>

    <!-- 悬浮模块 -->
    <view class="fixed bottom-4 right-4 flex flex-row items-center rounded-lg bg-gray-2 p-2">
      <!-- 收藏按钮 -->
      <view
        class="mr-2 cursor-pointer"
        @click="toggleCollect"
      >
        <view :class="isCollected ? 'i-mynaui:bookmark-solid text-yellow-300' : 'i-mynaui:bookmark text-gray-700'" class="text-2xl" />
        <text class="text-xs text-gray-700">
          {{ collectCount }}
        </text>
      </view>

      <!-- 点赞按钮 -->
      <view
        class="mr-2 cursor-pointer"
        @click="toggleLike"
      >
        <view :class="isLiked ? 'i-mynaui:heart-solid text-red-300' : 'i-mynaui:heart text-gray-700'" class="text-2xl" />
        <text class="text-xs text-gray-700">
          {{ likeCount }}
        </text>
      </view>

      <!-- 举报按钮 -->
      <view
        class="cursor-pointer"
        @click="reportPost"
      >
        <view class="i-mynaui:daze-ghost text-2xl text-gray-700" />
      </view>
    </view>

    <!-- 举报弹窗 -->
    <view v-if="showReportModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <view class="w-60 flex flex-col rounded-lg bg-white p-6 shadow-lg">
        <textarea
          v-model="reportReason"
          placeholder="请输入举报理由..."
          class="mb-4 w-full rounded-lg p-2 text-left text-gray-500"
          rows="4" style="box-sizing:border-box"
        />
        <view class="flex flex-row">
          <button class="rounded bg-gray-300 px-4 text-gray-700" @click="cancelReport">
            取消
          </button>
          <button class="rounded bg-red-500 px-4 text-white" @click="submitReport">
            提交
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* UnoCSS handles most of the styling using utility classes */

/* 可选的 swiper 样式 */
.swiper {
  width: 100%;
  height: 100%;
}

.swiper-item {
  display: flex;
  justify-content: center;
  align-items: center;
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
