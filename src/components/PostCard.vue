<script setup lang="ts">
import type { Post } from '@/types/Post'
import { API_BASE_URL } from '@/config/api'
import { getUserInfo } from '@/types/User'
import { computed, defineEmits, onMounted, ref } from 'vue'

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
const userId = ref('')
const isUserIdLoading = ref(false)

// 添加一个格式化日期的计算属性
const formattedDate = computed(() => {
  if (!props.post.publishTime)
    return ''

  try {
    // 将发布时间转换为日期对象
    const date = new Date(props.post.publishTime)

    // 检查日期是否有效
    if (Number.isNaN(date.getTime())) {
      return props.post.publishTime
    }

    // 格式化为年-月-日
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  catch (e) {
    console.error('日期格式化错误:', e)
    return props.post.publishTime
  }
})

// 在组件挂载时获取用户ID
onMounted(async () => {
  try {
    isUserIdLoading.value = true

    // 参照home.vue的方式获取用户ID
    const userInfo = uni.getStorageSync('userInfo')

    // 检查userInfo中的userId或id
    if (userInfo && (userInfo.userId || userInfo.id)) {
      userId.value = userInfo.userId || userInfo.id

      // 只有在有有效的帖子ID和用户ID时才检查点赞状态
      if (props.post && props.post.id) {
        await checkIsUserVoted()
      }
    }
    else {
      console.warn('无法获取有效的用户ID, 点赞功能可能受限')

      // 尝试从token中获取
      try {
        const userInfo = await getUserInfo()
        if (userInfo && userInfo.id) {
          userId.value = userInfo.id
          if (props.post && props.post.id) {
            await checkIsUserVoted()
          }
        }
      }
      catch (e) {
        console.warn('无法从getUserInfo获取用户ID:', e)
      }
    }
  }
  catch (e) {
    console.error('初始化用户ID失败:', e)
  }
  finally {
    isUserIdLoading.value = false
  }
})

// 检查用户是否已点赞该帖子
async function checkIsUserVoted() {
  try {
    if (!props.post.id || !userId.value)
      return

    // 直接通过URL参数传递
    const url = `${API_BASE_URL}/forum/post/isVoted?postId=${props.post.id}&userId=${userId.value}`

    const response = await uni.request({
      url,
      method: 'GET',
      header: {
        Authorization: uni.getStorageSync('token'),
      },
    }) as unknown as [any, UniApp.RequestSuccessCallbackResult] // 使用正确的类型

    // 安全地访问响应数据
    const responseData = response[1] as any
    if (responseData && responseData.statusCode === 200 && responseData.data) {
      const result = responseData.data
      if (result.code === 200) {
        isLiked.value = result.data === 1
      }
    }
  }
  catch (e) {
    console.error('检查点赞状态失败:', e)
  }
}

// 点赞或取消点赞
async function toggleLike() {
  // 确保用户已登录且有userId
  if (!userId.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    })
    return
  }

  try {
    // 先执行本地UI变更，提高响应速度
    const originalLiked = isLiked.value
    const originalLikes = likes.value

    // 立即更新UI
    if (isLiked.value) {
      likes.value -= 1
      isLiked.value = false
    }
    else {
      likes.value += 1
      isLiked.value = true
    }

    if (!props.post.id) {
      return // 如果没有必要的数据，仅执行本地更新
    }

    // 发送API请求
    const upvote = originalLiked ? '0' : '1' // 根据原始状态决定操作
    const url = `${API_BASE_URL}/forum/post/vote?postId=${props.post.id}&userId=${userId.value}&upvote=${upvote}`

    const response = await uni.request({
      url,
      method: 'GET',
      header: {
        Authorization: uni.getStorageSync('token'),
      },
    }) as unknown as [any, UniApp.RequestSuccessCallbackResult] // 使用正确的类型

    // 检查API响应
    const responseData = response[1] as any
    if (responseData && responseData.statusCode === 200 && responseData.data) {
      const result = responseData.data
      if (result.code === 200) {
        // 使用API返回的实际点赞数
        likes.value = result.data
      }
      else {
        // 如果API失败，恢复原始状态
        isLiked.value = originalLiked
        likes.value = originalLikes
      }
    }
    else {
      // API请求失败，恢复原始状态
      isLiked.value = originalLiked
      likes.value = originalLikes
    }
  }
  catch (e) {
    console.error('点赞操作失败:', e)
  }
}

// 修改计算属性处理图片URL
const postImage = computed(() => {
  if (!props.post.images || !Array.isArray(props.post.images) || props.post.images.length === 0) {
    return null
  }

  // 如果第一个元素是有效的URL字符串，直接返回
  if (typeof props.post.images[0] === 'string' && props.post.images[0].trim() !== '') {
    return props.post.images[0]
  }

  // 如果整个images是一个字符串（可能是逗号分隔的URLs）
  // 添加明确的类型断言，避免"类型'never'上不存在属性'split'"错误
  if (typeof props.post.images === 'string') {
    const imagesStr = props.post.images as string
    const urls = imagesStr.split(',').filter((url: string) => url.trim() !== '')
    return urls.length > 0 ? urls[0] : null
  }

  return null
})

function navigateToDetail() {
  // 确保ID是有效的，然后再导航
  if (props.post.id !== undefined && props.post.id !== null) {
    uni.navigateTo({
      url: `/pages/community/post?id=${props.post.id}`,
    })
  }
  else {
    console.error('Post ID is invalid:', props.post.id)
  }
}

function deletePost() {
  // 确保将ID转换为数字类型，如果可能的话
  const postId = typeof props.post.id === 'string' ? Number.parseInt(props.post.id, 10) : props.post.id
  emit('delete', postId as number)
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
      <!-- 显示第一张图片 - 使用计算属性处理图片URL -->
      <image
        v-if="postImage"
        :src="postImage"
        class="post-image mt-2 h-40 w-full rounded-lg object-cover"
      />
      <!-- 添加标题 -->
      <text class="title mt-2 text-left text-base">
        {{ post.title }}
      </text>
    </view>

    <!-- 发帖信息 -->
    <view class="post-info mb-4 flex items-center">
      <!-- 修改头像容器和样式，确保完美圆形 -->
      <view class="avatar-container">
        <image :src="post.userAvatar" class="avatar" />
      </view>
      <view class="user-info ml-3 flex flex-col items-start">
        <text class="username text-sm">
          {{ post.username }}
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

      <!-- 右侧内容：状态和发布时间 -->
      <view class="flex items-center">
        <!-- 仅在"我的"帖子中显示状态 -->
        <text v-if="props.isMyPost && post.state" class="mr-2 text-xs">
          {{ post.state }}
        </text>
        <!-- 发布时间，移到右下角 -->
        <text class="publish-time text-xs">
          {{ formattedDate }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 完善的圆形头像样式 */
.avatar-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50% !important;
  object-fit: cover;
}

.publish-time {
  font-size: 0.75rem;
}
</style>
