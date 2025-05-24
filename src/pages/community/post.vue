<!-- Post.vue -->
<script lang="ts">
import type { Comment } from '@/types/Comment'
import type { Post } from '@/types/Post'
import CommentsCard from '@/components/CommentsCard.vue'
import { API_BASE_URL } from '@/config/api'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'Post',
  components: {
    CommentsCard,
  },

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

    // 更新评论处理函数，获取用户详细信息
    const processComments = async (rawComments: any[]) => {
      const result: Comment[] = []
      const replyMap = new Map<string, Comment>()
      const userInfoCache = new Map<string, any>() // 缓存用户信息，避免重复请求

      // 获取单个用户信息的函数
      const getUserInfo = async (userId: string) => {
        // 如果已经缓存了该用户信息，直接返回
        if (userInfoCache.has(userId)) {
          return userInfoCache.get(userId)
        }

        try {
          const userRes = await new Promise<any>((resolve, reject) => {
            uni.request({
              url: `${API_BASE_URL}/api/v1/auth/user/${userId}`,
              method: 'GET',
              header: {
                'Authorization': token,
                'Content-Type': 'application/json',
              },
              success: res => resolve(res),
              fail: err => reject(err),
            })
          })

          if (userRes.statusCode === 200 && userRes.data) {
            // 缓存用户信息
            userInfoCache.set(userId, userRes.data)
            return userRes.data
          }
          return null
        }
        catch (error) {
          console.error('获取用户信息失败:', error)
          return null
        }
      }

      // 生成头像占位符的函数
      const generateAvatarPlaceholder = (username: string) => {
        const initial = username.charAt(0).toUpperCase()
        return `https://placehold.co/40x40/007bff/ffffff?text=${initial}`
      }

      // 处理评论和用户信息
      for (const comment of rawComments) {
        if (!comment.parentComment) {
          // 获取评论者的用户信息
          const userInfo = await getUserInfo(comment.userId)

          // 创建主评论对象，使用API返回的点赞数和点踩数
          const mainComment: Comment = {
            id: comment.id,
            username: userInfo?.username || '未知用户',
            avatar: userInfo?.avatarUrl || generateAvatarPlaceholder(userInfo?.username || '未知用户'),
            content: comment.content,
            publishTime: comment.createdTime,
            likes: comment.like || 0, // 使用API返回的点赞数
            dislikes: comment.dislike || 0, // 使用API返回的点踩数
            replies: [],
          }
          result.push(mainComment)
          replyMap.set(comment.id, mainComment)
        }
      }

      // 处理回复
      for (const comment of rawComments) {
        if (comment.parentComment) {
          const parentComment = replyMap.get(comment.parentComment)
          if (parentComment && comment.state !== 'deleted') {
            // 获取回复者的用户信息
            const userInfo = await getUserInfo(comment.userId)

            // 创建回复对象，回复不需要点赞数和点踩数
            const reply: Comment = {
              id: comment.id,
              username: userInfo?.username || '未知用户',
              avatar: userInfo?.avatarUrl || generateAvatarPlaceholder(userInfo?.username || '未知用户'),
              content: comment.content,
              publishTime: comment.createdTime,
              likes: 0, // 回复不显示点赞数
              dislikes: 0, // 回复不显示点踩数
              replies: [],
              parentComment: Number.parseInt(comment.parentComment),
              parentUsername: parentComment.username,
              state: comment.state, // 保存评论状态
            }
            parentComment.replies?.push(reply)
          }
        }
      }

      // 修改过滤条件使用 deleted 属性或检查 state
      return result.filter(comment => !comment.deleted && comment.state !== 'deleted')
    }

    // 获取评论列表
    const fetchComments = async () => {
      if (!postId)
        return

      try {
        // 显示加载提示
        uni.showLoading({
          title: '加载评论中...',
          mask: true,
        })

        // 第一步：获取评论列表
        const commentRes = await new Promise<any>((resolve, reject) => {
          uni.request({
            url: `${API_BASE_URL}/forum/comment/list?postId=${postId}`,
            method: 'GET',
            header: {
              'Authorization': token,
              'Content-Type': 'application/json',
            },
            success: res => resolve(res),
            fail: err => reject(err),
          })
        })

        // 检查评论请求是否成功
        if (commentRes.statusCode !== 200 || !commentRes.data || commentRes.data.code !== 200) {
          throw new Error(`获取评论失败: ${commentRes.data?.msg || '未知错误'}`)
        }

        const rawComments = commentRes.data.data || []

        // 第二步：处理评论，获取用户信息
        const processedComments = await processComments(rawComments)

        comments.value = processedComments

        // eslint-disable-next-line no-console
        console.log('处理后的评论:', comments.value)
      }
      catch (error) {
        console.error('获取评论失败:', error)
        uni.showToast({
          title: '获取评论失败',
          icon: 'none',
        })
      }
      finally {
        uni.hideLoading()
      }
    }

    // 悬浮模块状态
    const isCollected = ref(false)
    const isLiked = ref(false)
    const likeCount = ref(0)
    // 举报弹窗状态
    const showReportModal = ref(false)
    const reportReason = ref('')

    // 修改检查收藏状态的函数，使用更严格的类型断言
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
          success: (res: any) => { // 使用any类型绕过类型检查
            // eslint-disable-next-line no-console
            console.log('收藏状态检查响应:', res)

            // 直接访问属性，使用any类型避免TypeScript错误
            if (res.statusCode === 200 && res.data && res.data.code === 200) {
              isCollected.value = Boolean(res.data.data)
              // eslint-disable-next-line no-console
              console.log('帖子收藏状态:', isCollected.value ? '已收藏' : '未收藏')
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

    // 添加检查用户点赞状态的函数
    const checkIsUserVoted = async () => {
      if (!postId)
        return

      try {
        // 从本地存储获取用户ID
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.userId || userInfo?.id

        if (!userId) {
          console.error('未找到用户ID，无法检查点赞状态')
          return
        }

        // 调用API检查是否已点赞
        const response = await uni.request({
          url: `${API_BASE_URL}/forum/post/isVoted?postId=${postId}&userId=${userId}`,
          method: 'GET',
          header: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
        })

        // eslint-disable-next-line no-console
        console.log('点赞状态检查响应:', response)

        if (response.statusCode === 200 && response.data) {
          const result = response.data as any
          if (result.code === 200) {
            isLiked.value = result.data === 1
            // eslint-disable-next-line no-console
            console.log('帖子点赞状态:', isLiked.value ? '已点赞' : '未点赞')
          }
        }
      }
      catch (error) {
        console.error('检查点赞状态时出错:', error)
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

    // 在setup函数中添加新的状态和函数
    const replyToComment = ref<number | null>(null)
    const replyToUsername = ref('')

    // 修改提交评论的逻辑，实现API调用
    const submitComment = async () => {
      if (!newComment.value.trim()) {
        uni.showToast({
          title: '评论内容不能为空',
          icon: 'none',
        })
        return
      }

      if (!postId) {
        uni.showToast({
          title: '帖子ID无效',
          icon: 'none',
        })
        return
      }

      try {
        // 获取用户信息
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.userId || userInfo?.id

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
          postId,
          content: newComment.value,
          userId,
          parentComment: replyToComment.value, // 如果不是回复，则为null
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
                title: '评论成功',
                icon: 'success',
              })

              // 清空评论框和回复状态
              newComment.value = ''
              replyToComment.value = null
              replyToUsername.value = ''

              // 重新获取评论列表
              fetchComments()

              // 如果有评论数统计，更新评论数
              if (post.value) {
                if (post.value.commentCount !== undefined) {
                  post.value.commentCount += 1
                }
              }
            }
            else {
              // 评论失败
              uni.showToast({
                title: res.data?.msg || '评论失败',
                icon: 'none',
              })
            }
          },
          fail: (err) => {
            console.error('评论提交请求失败:', err)
            uni.showToast({
              title: '网络请求失败',
              icon: 'none',
            })
          },
          complete: () => {
            // 隐藏加载提示
            uni.hideLoading()
          },
        })
      }
      catch (error) {
        console.error('评论提交出错:', error)
        uni.hideLoading()
        uni.showToast({
          title: '评论失败',
          icon: 'none',
        })
      }
    }

    // 设置回复状态的函数
    const setReplyTo = (commentId: number, username: string) => {
      replyToComment.value = commentId
      replyToUsername.value = username
      // 设置回复内容提示
      newComment.value = `回复 @${username}: `
    }

    // 取消回复
    const cancelReply = () => {
      replyToComment.value = null
      replyToUsername.value = ''
      newComment.value = ''
    }

    // 修改收藏逻辑，移除数量相关代码
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

        // 显示加载中提示
        uni.showLoading({
          title: isCollected.value ? '取消收藏中...' : '收藏中...',
          mask: true,
        })

        // 根据当前收藏状态决定调用不同的API和HTTP方法
        if (isCollected.value) {
          // 取消收藏 - 使用DELETE方法
          await new Promise((resolve, reject) => {
            uni.request({
              url: `${API_BASE_URL}/forum/post/deleteFavorite?postId=${postId}&userId=${userId}`,
              method: 'DELETE',
              header: {
                'Authorization': token,
                'Content-Type': 'application/json',
              },
              success: (res: any) => { // 使用any类型绕过类型检查
                // eslint-disable-next-line no-console
                console.log('取消收藏响应:', res)

                if (res.statusCode === 200 && res.data && res.data.code === 200) {
                  isCollected.value = false

                  uni.showToast({
                    title: '已取消收藏',
                    icon: 'success',
                  })
                  resolve(true)
                }
                else {
                  // 可以直接访问res.data.msg，因为我们使用了any类型
                  reject(new Error(`取消收藏失败: ${res.data?.msg || '未知错误'}`))
                }
              },
              fail: (err) => {
                reject(err)
              },
              complete: () => {
                uni.hideLoading()
              },
            })
          })
        }
        else {
          // 收藏帖子 - 使用POST方法
          await new Promise((resolve, reject) => {
            uni.request({
              url: `${API_BASE_URL}/forum/post/favorite?postId=${postId}&userId=${userId}`,
              method: 'POST',
              header: {
                'Authorization': token,
                'Content-Type': 'application/json',
              },
              success: (res: any) => { // 使用any类型绕过类型检查
                // eslint-disable-next-line no-console
                console.log('收藏帖子响应:', res)

                if (res.statusCode === 200 && res.data && res.data.code === 200) {
                  isCollected.value = true

                  uni.showToast({
                    title: '收藏成功',
                    icon: 'success',
                  })
                  resolve(true)
                }
                else {
                  reject(new Error(`收藏失败: ${res.data?.msg || '未知错误'}`))
                }
              },
              fail: (err) => {
                reject(err)
              },
              complete: () => {
                uni.hideLoading()
              },
            })
          })
        }
      }
      catch (error) {
        uni.hideLoading()
        console.error('收藏操作失败:', error)
        uni.showToast({
          title: isCollected.value ? '取消收藏失败' : '收藏失败',
          icon: 'none',
        })
      }
    }

    // 点赞逻辑
    const toggleLike = async () => {
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

        if (!postId) {
          uni.showToast({
            title: '帖子ID无效',
            icon: 'none',
          })
          return
        }

        // 显示加载中提示
        uni.showLoading({
          title: isLiked.value ? '取消点赞中...' : '点赞中...',
          mask: true,
        })

        // 根据当前点赞状态决定upvote参数
        const upvoteParam = isLiked.value ? 'null' : 'true'
        const voteUrl = `${API_BASE_URL}/forum/post/vote?postId=${postId}&userId=${userId}&upvote=${upvoteParam}`

        const response = await uni.request({
          url: voteUrl,
          method: 'POST',
          header: {
            'Authorization': uni.getStorageSync('token'),
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200 && response.data) {
          const result = response.data as any
          if (result.code === 200) {
            // 更新点赞状态和数量
            isLiked.value = !isLiked.value
            likeCount.value = result.like

            uni.showToast({
              title: isLiked.value ? '点赞成功' : '已取消点赞',
              icon: 'success',
            })
          }
          else {
            throw new Error(`点赞操作失败: ${result.msg || '未知错误'}`)
          }
        }
        else {
          throw new Error(`请求失败: ${response.statusCode}`)
        }
      }
      catch (error) {
        console.error('点赞操作失败:', error)
        uni.showToast({
          title: '点赞操作失败',
          icon: 'none',
        })
      }
      finally {
        uni.hideLoading()
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
                // 移除收藏数量初始化
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

        // 添加：检查帖子是否已被点赞
        checkIsUserVoted()
      }
      else {
        console.error('Invalid postId:', postId)
        uni.showToast({
          title: '无效的帖子ID',
          icon: 'none',
        })
      }
    })

    // 添加刷新评论的方法
    const refreshComments = () => {
      fetchComments()
      if (post.value && post.value.commentCount !== undefined) {
        post.value.commentCount += 1
      }
    }

    // 在返回值中移除 collectCount
    return {
      post,
      postId,
      comments,
      refreshComments,
      handleBack,
      handleShare,
      currentImage,
      newComment,
      onImageChange,
      submitComment,
      toggleCollect,
      toggleLike,
      reportPost,
      isCollected,
      isLiked,
      likeCount,
      showReportModal,
      reportReason,
      submitReport,
      cancelReport,
      isExpanded,
      toggleExpand,
      fetchComments,
      formattedDate,
      replyToComment,
      replyToUsername,
      setReplyTo,
      cancelReply,
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

    <!-- 评论列表 - 使用CommentsCard组件 -->
    <view class="flex-1 overflow-y-auto p-2">
      <view v-if="comments.length === 0" class="h-20 flex items-center justify-center text-gray-500">
        暂无评论，发表第一条评论吧
      </view>
      <CommentsCard
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :post-id="postId"
        @comment-added="refreshComments"
      />
    </view>

    <!-- 悬浮模块 -->
    <view class="fixed bottom-4 right-4 z-50 flex flex-row items-center rounded-lg bg-yellow p-2">
      <!-- 收藏按钮 - 移除数量显示 -->
      <view
        class="mr-2 cursor-pointer"
        @click="toggleCollect"
      >
        <view :class="isCollected ? 'i-mynaui:bookmark-solid text-green' : 'i-mynaui:bookmark'" class="text-2xl" />
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
