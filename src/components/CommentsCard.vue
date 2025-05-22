<!-- CommentsCard.vue -->
<script lang="ts">
import type { Comment } from '@/types/Comment'
import type { PropType } from 'vue'
import { API_BASE_URL } from '@/config/api'
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'CommentsCard',
  props: {
    comment: {
      type: Object as PropType<Comment>,
      required: true,
    },
    postId: {
      type: String,
      required: true,
    },
  },
  emits: ['comment-added'],
  setup(props, { emit }) {
    const isReplying = ref(false)
    const replyContent = ref('')
    const isLiked = ref(false)
    const isDisliked = ref(false)
    const likes = ref(props.comment.likes)
    const dislikes = ref(props.comment.dislikes)

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
      if (isReplying.value) {
        replyContent.value = `@${props.comment.username} `
      }
    }

    const submitReply = async () => {
      if (!replyContent.value.trim()) {
        uni.showToast({
          title: '评论内容不能为空',
          icon: 'none',
        })
        return
      }

      try {
        // 获取用户信息
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.userId || userInfo?.id
        const token = uni.getStorageSync('token')

        if (!userId) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 显示加载提示
        uni.showLoading({
          title: '发表评论中...',
          mask: true,
        })

        // 准备评论数据
        const commentData = {
          postId: props.postId,
          content: replyContent.value,
          userId,
          parentComment: props.comment.id, // 设置为当前评论的ID
        }

        // 调用评论API
        uni.request({
          url: `${API_BASE_URL}/forum/comment/post`,
          method: 'POST',
          header: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          data: commentData,
          success: (res: any) => {
            // 检查响应
            if (res.statusCode === 200 && res.data && res.data.code === 200) {
              // 评论成功
              uni.showToast({
                title: '回复成功',
                icon: 'success',
              })

              // 重置状态
              isReplying.value = false
              replyContent.value = ''

              // 通知父组件刷新评论
              emit('comment-added')
            }
            else {
              uni.showToast({
                title: res.data?.msg || '回复失败',
                icon: 'none',
              })
            }
          },
          fail: (err) => {
            console.error('回复评论失败:', err)
            uni.showToast({
              title: '网络请求失败',
              icon: 'none',
            })
          },
          complete: () => {
            uni.hideLoading()
          },
        })
      }
      catch (error) {
        console.error('回复评论出错:', error)
        uni.hideLoading()
        uni.showToast({
          title: '回复失败',
          icon: 'none',
        })
      }
    }

    // 格式化日期显示
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString)
        if (Number.isNaN(date.getTime()))
          return dateString
        return date.toLocaleDateString()
      }
      catch (e) {
        console.error('日期格式化错误:', e)
        return dateString
      }
    }

    // 新增：处理头像占位符
    const getAvatar = (comment: Comment) => {
      if (comment.avatar && comment.avatar !== 'null' && !comment.avatar.includes('undefined')) {
        return comment.avatar
      }
      // 返回首字母占位图
      const initial = comment.username.charAt(0).toUpperCase()
      return `https://placehold.co/40x40/007bff/ffffff?text=${initial}`
    }

    return {
      isReplying,
      replyContent,
      isLiked,
      isDisliked,
      likes,
      dislikes,
      toggleLike,
      toggleDislike,
      toggleReply,
      submitReply,
      formatDate,
      getAvatar,
      hasReplies: computed(() => props.comment.replies && props.comment.replies.length > 0),
    }
  },
})
</script>

<template>
  <view class="mb-3 border-b border-gray-100 rounded-lg p-3">
    <!-- 用户信息和发布时间 -->
    <view class="mb-2 flex items-center justify-between">
      <view class="flex items-center">
        <image :src="getAvatar(comment)" class="mr-2 h-8 w-8 rounded-full" />
        <text class="font-medium">
          {{ comment.username }}
        </text>
      </view>
      <view class="text-sm text-gray-500">
        {{ formatDate(comment.publishTime) }}
      </view>
    </view>

    <!-- 评论内容 -->
    <text class="mb-3 block text-left text-base">
      {{ comment.content }}
    </text>

    <!-- 评论操作区 -->
    <view class="flex items-center justify-between">
      <!-- 点赞/踩 -->
      <view class="flex space-x-4">
        <view class="flex cursor-pointer items-center" @click="toggleLike">
          <view :class="isLiked ? 'i-mynaui:heart-solid text-red-500' : 'i-mynaui:heart'" class="text-xl" />
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

      <!-- 回复按钮 -->
      <view class="flex cursor-pointer items-center text-blue-500" @click="toggleReply">
        <view class="i-mynaui:message-reply mr-1 text-lg" />
        <text class="text-sm">
          回复
        </text>
      </view>
    </view>

    <!-- 回复输入框 -->
    <view v-if="isReplying" class="mt-3">
      <view class="flex items-center border border-gray-300 rounded-lg bg-white">
        <input
          v-model="replyContent"
          type="text"
          placeholder="回复评论..."
          class="flex-1 rounded-lg px-3 py-2 text-left focus:outline-none"
          @keydown.enter="submitReply"
        >
        <view class="cursor-pointer px-3 text-yellow" @click="submitReply">
          <view class="i-mynaui:send text-xl" />
        </view>
      </view>
    </view>

    <!-- 回复列表 -->
    <view v-if="hasReplies" class="mt-3 border-l-2 border-gray-200 pl-4">
      <view v-for="reply in comment.replies" :key="reply.id" class="mb-2 pt-2">
        <view class="mb-1 flex items-center justify-between">
          <view class="flex items-center">
            <image :src="getAvatar(reply)" class="mr-2 h-6 w-6 rounded-full" />
            <text class="font-medium">
              {{ reply.username }}
            </text>
          </view>
          <text class="text-xs text-gray-500">
            {{ formatDate(reply.publishTime) }}
          </text>
        </view>
        <text class="text-left text-sm">
          {{ reply.content }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 使用 UnoCSS 进行样式化，不需要额外的 CSS */
</style>
