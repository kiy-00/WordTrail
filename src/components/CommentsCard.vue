<!-- CommentsCard.vue -->
<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'

interface Comment {
  id: number
  username: string
  avatar: string
  content: string
  publishTime: string
  likes: number
  dislikes: number
  replies?: Comment[]
  parentUsername?: string
}

export default defineComponent({
  name: 'CommentsCard',
  props: {
    comment: {
      type: Object as () => Comment,
      required: true,
    },
    parentUsername: {
      type: String,
      default: '',
    },
    rootComment: {
      type: Object as () => Comment,
      required: true,
    },
  },
  setup(props) {
    const rootComment = reactive({ ...props.rootComment }) // 深拷贝并转换为响应式对象
    const likes = ref(props.comment.likes)
    const dislikes = ref(props.comment.dislikes)
    const isLiked = ref(false)
    const isDisliked = ref(false)
    const isReplying = ref(false)
    const replyContent = ref('')
    const replies = ref<Comment[]>(props.comment.replies || [])

    const toggleLike = () => {
      if (isLiked.value) {
        likes.value--
        isLiked.value = false
      }
      else {
        likes.value++
        isLiked.value = true
        if (isDisliked.value) {
          dislikes.value--
          isDisliked.value = false
        }
      }
    }

    const toggleDislike = () => {
      if (isDisliked.value) {
        dislikes.value--
        isDisliked.value = false
      }
      else {
        dislikes.value++
        isDisliked.value = true
        if (isLiked.value) {
          likes.value--
          isLiked.value = false
        }
      }
    }

    const toggleReply = () => {
      isReplying.value = !isReplying.value
    }
    const submitReply = () => {
      if (replyContent.value.trim()) {
        const newReply: Comment = {
          id: Date.now(),
          username: '新用户',
          avatar: 'https://via.placeholder.com/30',
          content: replyContent.value.trim(),
          publishTime: new Date().toISOString().split('T')[0],
          likes: 0,
          dislikes: 0,
          parentUsername: props.comment.username, // 被回复者的用户名
        }
        // 检查并初始化 rootComment.replies
        if (!rootComment.replies) {
          rootComment.replies = []
        }
        // 将新回复添加到主评论的 replies 数组中
        rootComment.replies.push(newReply)
        replyContent.value = ''
        isReplying.value = false
      }
    }

    return {
      likes,
      dislikes,
      isLiked,
      isDisliked,
      isReplying,
      replyContent,
      replies,
      toggleLike,
      toggleDislike,
      toggleReply,
      submitReply,
    }
  },
})
</script>

<template>
  <view class="mb-4 flex flex-col rounded-lg p-4 shadow frosted-glass">
    <!-- 用户信息和点赞/点踩 -->
    <view class="flex items-center justify-between">
      <!-- 用户信息 -->
      <view class="flex items-center">
        <image :src="comment.avatar" class="h-10 w-10 rounded-full object-cover" />
        <view class="ml-3 flex flex-col items-start">
          <text class="font-500">
            {{ comment.username }}
          </text>
          <text class="text-sm">
            {{ comment.publishTime }}
          </text>
        </view>
      </view>

      <!-- 点赞和点踩 -->
      <view class="flex items-center space-x-4">
        <view class="flex cursor-pointer items-center" @click="toggleLike">
          <view :class="isLiked ? 'i-mynaui:heart-solid text-red-500' : 'i-mynaui:heart '" class="text-xl" />
          <text class="ml-1 text-sm">
            {{ likes }}
          </text>
        </view>
        <view class="flex cursor-pointer items-center" @click="toggleDislike">
          <view :class="isDisliked ? 'i-mynaui:sad-ghost-solid text-blue-500' : 'i-mynaui:sad-ghost'" class="text-xl" />
          <text class="ml-1 text-sm">
            {{ dislikes }}
          </text>
        </view>
      </view>
    </view>

    <!-- 评论内容 -->
    <view class="mt-4 flex items-center">
      <!-- 回复图标 -->
      <view v-if="comment.parentUsername" class="i-mynaui:fat-corner-up-left text-yellow" />
      <!-- 被回复者的名字 -->
      <text v-if="comment.parentUsername" class="font-500">
        @{{ comment.parentUsername }}：
      </text>
      <text class="text-left">
        <span v-if="parentUsername" class="font-semibold">{{ parentUsername }}: </span>{{ comment.content }}
      </text>
    </view>

    <!-- 回复按钮 -->
    <view class="mt-2 flex justify-start">
      <text class="i-mynaui:message-reply cursor-pointer text-yellow" @click="toggleReply" />
    </view>

    <!-- 回复输入框（与主评论输入框样式一致） -->
    <view v-if="isReplying" class="mt-2 rounded-sm">
      <view class="flex items-center space-x-2">
        <input
          v-model="replyContent"
          type="text"
          placeholder="reply..."
          class="border-solied w-full rounded-lg px-2 py-2 text-left focus:outline-none"
          @keydown.enter="submitReply"
        >
        <view class="i-mynaui:send cursor-pointer text-yellow" @click="submitReply" />
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 使用 UnoCSS 进行样式化，不需要额外的 CSS */
</style>
