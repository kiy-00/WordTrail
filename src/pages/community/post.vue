<!-- Post.vue -->
<script lang="ts">
import type { Comment, Post } from '@/types/Post'
import { API_BASE_URL } from '@/config/api' // 添加导入API_BASE_URL
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'Post',

  setup() {
    const route = useRoute()
    // eslint-disable-next-line no-console
    console.log('Route object:', route) // 调试路由对象

    // 修改获取 postId 的方式 - 不再转换为数字，保持原始字符串格式
    const postId = route.query.id as string
    // eslint-disable-next-line no-console
    console.log('PostId from query:', postId) // 调试 postId

    const token = uni.getStorageSync('token')
    // eslint-disable-next-line no-console
    console.log('Token:', token) // 检查 token 是否存在

    // 使用 postId 来设置帖子数据
    const post = ref<Post | null>(null)

    const currentImage = ref(0)
    const newComment = ref('')
    const comments = ref<Comment[]>([])

    // 评论列表数据结构处理
    const processComments = (rawComments: any[]) => {
      const result: Comment[] = []
      const replyMap = new Map<number, Comment>()

      // 首先找出所有主评论
      rawComments.forEach((comment) => {
        if (!comment.parentComment) {
          const mainComment: Comment = {
            id: comment.id,
            username: comment.nickName,
            avatar: comment.avatar || 'https://via.placeholder.com/40',
            content: comment.content,
            publishTime: comment.createdTime,
            likes: 0,
            dislikes: 0,
            replies: [],
          }
          result.push(mainComment)
          replyMap.set(comment.id, mainComment)
        }
      })

      // 处理回复
      rawComments.forEach((comment) => {
        if (comment.parentComment) {
          const parentComment = replyMap.get(comment.parentComment)
          if (parentComment && !comment.deleted) {
            const reply: Comment = {
              id: comment.id,
              username: comment.nickName,
              avatar: comment.avatar || 'https://via.placeholder.com/40',
              content: comment.content,
              publishTime: comment.createdTime,
              likes: 0,
              dislikes: 0,
              replies: [],
            }
            parentComment.replies?.push(reply)
          }
        }
      })

      return result.filter(comment => !comment.content.includes('[该评论已被删除]'))
    }

    // 获取评论列表
    const fetchComments = () => {
      if (!postId)
        return

      uni.request({
        url: `${API_BASE_URL}/forum/comment/list?postId=${postId}`, // 添加API_BASE_URL
        method: 'GET',
        header: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        success: (res: any) => {
          const { data, statusCode } = res
          if (statusCode === 200 && data.code === 200) {
            comments.value = processComments(data.data)
          }
          else {
            console.error('获取评论失败:', data.msg)
          }
        },
        fail: (err) => {
          console.error('获取评论请求失败:', err)
        },
      })
    }

    // 悬浮模块状态
    const isCollected = ref(false)
    const isLiked = ref(false)
    const likeCount = ref(0)
    const collectCount = ref(0)
    // 举报弹窗状态
    const showReportModal = ref(false)
    const reportReason = ref('')

    // 添加：检查帖子是否已被收藏
    const checkIsFavorite = async () => {
      if (!postId)
        return

      try {
        // 从本地存储获取用户ID
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.userId || userInfo?.id

        if (!userId) {
          console.error('未找到用户ID，无法检查收藏状态')
          return
        }

        // 调用API检查是否已收藏
        uni.request({
          url: `${API_BASE_URL}/forum/post/isFavorite?postId=${postId}&userId=${userId}`,
          method: 'POST',
          header: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          success: (res) => {
            // eslint-disable-next-line no-console
            console.log('收藏状态检查响应:', res)

            // 添加类型检查以修复 TypeScript 错误
            if (res.statusCode === 200 && typeof res.data === 'object' && res.data !== null) {
              // 使用类型断言
              const responseData = res.data as { code: number, msg: string | null, data: boolean }

              if (responseData.code === 200) {
                isCollected.value = Boolean(responseData.data)
                // eslint-disable-next-line no-console
                console.log('帖子收藏状态:', isCollected.value ? '已收藏' : '未收藏')
              }
            }
          },
          fail: (err) => {
            console.error('检查收藏状态请求失败:', err)
          },
        })
      }
      catch (error) {
        console.error('检查收藏状态时出错:', error)
      }
    }

    // 返回逻辑
    const handleBack = () => {
      uni.navigateBack()
    }

    const handleShare = () => {
      // 实现分享逻辑
    }

    const onImageChange = (e: any) => {
      currentImage.value = e.detail.current
    }

    // 修改提交评论的逻辑
    const submitComment = () => {
      if (newComment.value.trim()) {
        // TODO: 实现评论提交的 API 调用
        // 提交成功后重新获取评论列表
        fetchComments()
        newComment.value = ''
      }
    }

    // 修改：收藏逻辑，添加API调用
    const toggleCollect = async () => {
      try {
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.userId || userInfo?.id

        if (!userId) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 根据当前收藏状态决定调用哪个API
        const apiUrl = `${API_BASE_URL}/forum/post/${isCollected.value ? 'cancelFavorite' : 'favorite'}`

        // 执行收藏或取消收藏操作
        const response = await uni.request({
          url: apiUrl,
          method: 'POST',
          data: {
            postId,
            userId,
          },
          header: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
        })

        const [err, res] = response as unknown as [any, { data: any, statusCode: number }]

        if (err) {
          throw err
        }

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          // 操作成功，更新UI状态
          isCollected.value = !isCollected.value

          if (isCollected.value) {
            collectCount.value += 1
            uni.showToast({
              title: '收藏成功',
              icon: 'success',
            })
          }
          else {
            collectCount.value -= 1
            uni.showToast({
              title: '已取消收藏',
              icon: 'none',
            })
          }
        }
        else {
          throw new Error(res.data.msg || '操作失败')
        }
      }
      catch (error) {
        console.error('收藏操作失败:', error)
        uni.showToast({
          title: isCollected.value ? '取消收藏失败' : '收藏失败',
          icon: 'none',
        })
      }
    }

    // 点赞逻辑
    const toggleLike = () => {
      isLiked.value = !isLiked.value
      if (isLiked.value) {
        likeCount.value += 1
        // 执行点赞操作，例如发送 API 请求
      }
      else {
        likeCount.value -= 1
        // 取消点赞操作
      }
    }

    // 举报逻辑
    const reportPost = () => {
      showReportModal.value = true
    }

    const submitReport = () => {
      if (reportReason.value.trim()) {
        // 发送举报请求到服务器
        showReportModal.value = false
        uni.showToast({
          title: '已举报',
          icon: 'none',
        })
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

    // 简化展开/收起逻辑
    const isExpanded = ref(false)
    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value
    }

    // 添加格式化日期的计算属性
    const formattedDate = computed(() => {
      if (!post.value || !post.value.publishTime)
        return ''

      try {
        // 将发布时间转换为日期对象
        const date = new Date(post.value.publishTime)

        // 检查日期是否有效
        if (Number.isNaN(date.getTime())) {
          return post.value.publishTime
        }

        // 格式化为年-月-日
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      }
      catch (e) {
        console.error('日期格式化错误:', e)
        return post.value.publishTime
      }
    })

    onMounted(() => {
      // eslint-disable-next-line no-console
      console.log('onMounted triggered') // 检查 onMounted 是否执行
      if (postId) { // 只检查postId是否存在，不转换类型
        // eslint-disable-next-line no-console
        console.log('Attempting to fetch post with id:', postId) // 检查请求是否发起

        // 添加详细的日志输出
        // eslint-disable-next-line no-console
        console.log(`完整请求URL: ${API_BASE_URL}/forum/post/get?id=${postId}`)

        uni.request({
          url: `${API_BASE_URL}/forum/post/get?id=${postId}`, // 添加API_BASE_URL
          method: 'GET',
          header: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          success: (res: any) => {
            // eslint-disable-next-line no-console
            console.log('API Response:', res) // 检查完整响应
            const { data, statusCode } = res
            // eslint-disable-next-line no-console
            console.log('Status code:', statusCode) // 检查状态码
            // eslint-disable-next-line no-console
            console.log('Response data:', data) // 检查响应数据

            if (statusCode === 200 && data && data.code === 200) {
              // 修改：正确获取嵌套在 data.data 中的帖子数据
              const postData = data.data
              if (postData) {
                // eslint-disable-next-line no-console
                console.log('Post data before mapping:', postData) // 检查原始数据
                post.value = {
                  id: postData.id,
                  title: postData.title || '',
                  content: postData.content || '',
                  publishTime: postData.createdTime, // 修改：使用 createdTime 而不是 createdAt
                  username: postData.username || '', // 修改：使用 username 而不是 author
                  userAvatar: postData.userAvatar || `https://placehold.co/40x40/007bff/ffffff?text=${(postData.username || '匿名').charAt(0)}`,
                  images: postData.filePaths || [], // 使用 filePaths
                  likes: postData.voteCount || 0,
                  commentCount: postData.commentCount || 0,
                  collects: 0, // API 中没有此字段
                  state: postData.state,
                }
                // eslint-disable-next-line no-console
                console.log('Post data after mapping:', post.value) // 检查映射后的数据

                // 更新状态
                likeCount.value = postData.voteCount || 0
                collectCount.value = 0
                // eslint-disable-next-line no-console
                console.log('帖子数据加载成功:', post.value) // 添加调试日志
              }
              else {
                console.error('Post data is null') // 检查数据是否为空
                uni.showToast({
                  title: '获取帖子详情失败',
                  icon: 'none',
                })
              }
            }
            else {
              console.error('API error: Status code', statusCode, 'or invalid data format') // 检查错误信息
              uni.showToast({
                title: '获取帖子详情失败',
                icon: 'none',
              })
            }
          },
          fail: (err) => {
            console.error('请求失败详情:', JSON.stringify(err)) // 增加详细错误日志
            uni.showToast({
              title: '网络请求失败，请稍后重试',
              icon: 'none',
            })
          },
        })

        // 获取评论列表时也直接使用字符串ID
        fetchComments()

        // 添加：检查帖子是否已被收藏
        checkIsFavorite()
      }
      else {
        console.error('Invalid postId:', postId)
        uni.showToast({
          title: '无效的帖子ID',
          icon: 'none',
        })
      }
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
      isExpanded,
      toggleExpand,
      fetchComments,
      formattedDate, // 添加到返回值中
    }
  },
})
</script>

<template>
  <template v-if="post">
    <PostHeader
      :user-avatar="post.userAvatar"
      :username="post.username"
      @back="handleBack"
      @share="handleShare"
    />

    <!-- Image Carousel -->
    <view class="relative mt-3">
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
          :class="currentImage === index ? 'bg-yellow' : 'bg-gray-300'"
        />
      </view>
    </view>

    <!-- Post Content -->
    <view class="mt-2 flex flex-col rounded-lg p-4 frosted-glass">
      <text class="w-full text-left text-xl font-500">
        {{ post.title }}
      </text>
      <view class="relative mt-2 w-full">
        <!-- 添加滚动容器 -->
        <scroll-view
          :scroll-y="isExpanded"
          class="content-scroll w-full"
          :class="{ expanded: isExpanded }"
        >
          <text class="block w-full whitespace-pre-wrap text-left">
            {{ post.content }}
          </text>
        </scroll-view>
        <!-- 展开/收起按钮 -->
        <view
          class="mt-2 flex cursor-pointer justify-center text-yellow"
          @click="toggleExpand"
        >
          <view
            class="i-mynaui:arrow-down text-2xl transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded }"
          />
        </view>
      </view>
      <text class="mt-4 w-full text-left text-sm">
        {{ formattedDate }}
      </text>
    </view>

    <!-- Comment Input -->
    <view class="flex items-center bg-transparent p-2">
      <input
        v-model="newComment"
        type="text"
        placeholder="发表评论..."
        class="w-full border-gray-300 rounded-lg border-solid px-3 py-2 text-left focus:border-yellow focus:outline-none"
        @keydown.enter="submitComment"
      >
      <view class="i-mynaui:message-reply m-1 cursor-pointer text-2xl text-yellow" @click="submitComment" />
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
    <view class="fixed bottom-4 right-4 z-50 flex flex-row items-center rounded-lg bg-yellow p-2">
      <!-- 收藏按钮 -->
      <view
        class="mr-2 cursor-pointer"
        @click="toggleCollect"
      >
        <view :class="isCollected ? 'i-mynaui:bookmark-solid text-green' : 'i-mynaui:bookmark'" class="text-2xl" />
        <text class="text-xs">
          {{ collectCount }}
        </text>
      </view>

      <!-- 点赞按钮 -->
      <view
        class="mr-2 cursor-pointer"
        @click="toggleLike"
      >
        <view :class="isLiked ? 'i-mynaui:heart-solid text-red' : 'i-mynaui:heart'" class="text-2xl" />
        <text class="text-xs">
          {{ likeCount }}
        </text>
      </view>

      <!-- 举报按钮 -->
      <view
        class="cursor-pointer"
        @click="reportPost"
      >
        <view class="i-mynaui:daze-ghost text-2xl" />
      </view>
    </view>

    <!-- 举报弹窗 -->
    <view v-if="showReportModal" class="fixed inset-0 flex items-center justify-center blue-frosted-glass">
      <view class="w-60 flex flex-col rounded-lg p-6 shadow-lg frosted-glass">
        <textarea
          v-model="reportReason"
          placeholder="请输入举报理由..."
          class="mb-4 w-full rounded-lg p-2 text-left"
          rows="4" style="box-sizing:border-box"
        />
        <view class="flex flex-row">
          <button class="rounded px-4 frosted-glass" @click="cancelReport">
            取消
          </button>
          <button class="rounded bg-yellow px-4 text-white" @click="submitReport">
            提交
          </button>
        </view>
      </view>
    </view>
  </template>
  <template v-else>
    <view class="h-full flex items-center justify-center">
      <text>加载中...</text>
    </view>
  </template>
</template>

<style scoped>
/* UnoCSS handles most of the styling using utility classes */

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

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.transition-all {
  transition: all 0.3s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* 删除原有的 arrow-button 相关样式 */

.content-scroll {
  max-height: 4.5em; /* 默认显示3行 */
  transition: max-height 0.3s ease;
}

.content-scroll.expanded {
  max-height: 300px; /* 展开后的最大高度 */
}

/* 自定义滚动条样式 */
.content-scroll ::-webkit-scrollbar {
  width: 4px;
}

.content-scroll ::-webkit-scrollbar-thumb {
  background-color: #FFC107;
  border-radius: 2px;
}

.content-scroll ::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>

<route lang="json">
  {
    "layout": "default"
  }
</route>
