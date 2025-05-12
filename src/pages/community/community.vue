<script lang="ts">
import type { Post } from '@/types/Post'
import { API_BASE_URL } from '@/config/api'
import { getUserInfo } from '@/types/User'
import { defineComponent, ref } from 'vue'

// 定义API响应的接口
interface ApiResponse {
  code: number
  msg: string | null
  data: Array<{
    id: string | number // 修改为支持 string | number 类型
    createdTime: string
    updatedTime: string | null
    title: string
    username: string | null
    userAvatarUrl: string
    commentCount: number
    voteCount: number
  }>
}

export default defineComponent({
  name: 'Community',

  setup() {
    const activeTab = ref<'recommend' | 'my' | 'favorites'>('recommend')
    const allRecommendedPosts = ref<Post[]>([])
    const allMyPosts = ref<Post[]>([])
    const allFavoritePosts = ref<Post[]>([])

    const displayedPosts = ref<Post[]>([])
    const isRefreshing = ref(false)
    const postsPerLoad = 50
    const currentLoad = ref(1)

    // 新增：备选的获取推荐帖子的方法
    const fetchRecommendedPostsFallback = async () => {
      try {
        const response: UniApp.RequestSuccessCallbackResult = await uni.request({
          url: `${API_BASE_URL}/forum/post/list?page=${String(currentLoad.value)}`,
          method: 'GET',
          header: {
            'Authorization': uni.getStorageSync('token'),
            'content-type': 'application/json',
          },
        })

        console.error('Fallback response:', response) // 调试日志

        if (response.statusCode === 200 && response.data) {
          const result = response.data as ApiResponse

          if (result.code === 200 && Array.isArray(result.data)) {
            const formattedPosts: Post[] = result.data.map(post => ({
              id: Number(post.id), // 确保强制转换为 number 类型
              title: post.title || '无标题',
              content: '',
              publishTime: post.createdTime,
              username: post.username || '匿名用户',
              userAvatar: post.userAvatarUrl || `https://via.placeholder.com/40?text=U${post.id}`,
              images: [], // 保持为空数组，以便与PostCard兼容
              tags: [],
              likes: post.voteCount || 0,
              commentCount: post.commentCount || 0,
            }))
            allRecommendedPosts.value = formattedPosts

            // 如果当前是"推荐"标签页，更新显示的帖子
            if (activeTab.value === 'recommend') {
              displayedPosts.value = formattedPosts
            }

            console.error('Formatted fallback posts:', formattedPosts)
          }
        }
      }
      catch (error) {
        console.error('获取备选推荐帖子失败:', error)
        throw error // 继续抛出错误，让上层处理
      }
    }

    // 修改：获取随机帖子的函数
    const fetchRandomPosts = async () => {
      try {
        const token = uni.getStorageSync('token')

        // 修改：确保使用完整的API URL（添加API_BASE_URL前缀）
        const url = `${API_BASE_URL}/forum/post/random`

        // eslint-disable-next-line no-console
        console.log('获取随机帖子请求URL:', url) // 调试日志

        const response: UniApp.RequestSuccessCallbackResult = await uni.request({
          url,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'content-type': 'application/json',
            'Accept': 'application/json', // 明确指定接受JSON响应
          },
        })

        // eslint-disable-next-line no-console
        console.log('Random posts response:', response) // 调试日志

        // 检查响应状态码
        if (response.statusCode !== 200) {
          throw new Error(`API 响应错误，状态码: ${response.statusCode}`)
        }

        // 获取响应数据并进行类型检查
        const result = response.data

        // 检查返回的是否是有效数据
        if (!result) {
          throw new Error('API 返回了空数据')
        }

        // 检查返回的是否是数组（因为我们期望的是一个帖子数组）
        if (Array.isArray(result)) {
          // eslint-disable-next-line no-console
          console.log('Random posts data:', result) // 调试日志

          // 将响应数据转换为Post类型格式
          const formattedPosts: Post[] = result.map((post) => {
            // 确保正确处理图片数据
            let images: string[] = []

            // 检查是否有 filePaths 字段并且是数组
            if (post.filePaths && Array.isArray(post.filePaths) && post.filePaths.length > 0) {
              images = post.filePaths
            }
            // 如果没有 filePaths，尝试从 content 中提取图片
            else if (post.content && typeof post.content === 'string') {
              const contentImages = post.content.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif)/gi) || []
              if (contentImages.length > 0) {
                images = contentImages
              }
            }

            // 如果还是没有图片，使用占位图片
            if (images.length === 0) {
              images = ['https://placehold.co/600x400?text=暂无图片']
            }

            return {
              id: post.id || Math.random(), // 保留原始ID，不强制转换为数字
              title: post.title || '无标题',
              content: post.content || '',
              publishTime: post.createdTime,
              username: post.author || '匿名用户',
              userAvatar: post.userAvatar || `https://placehold.co/40x40/007bff/ffffff?text=${(post.author || '匿名').charAt(0)}`,
              images, // 使用处理后的图片数组
              likes: post.voteCount || 0,
              commentCount: post.commentCount || 0,
              state: post.state || 'normal',
            }
          })

          // 更新推荐帖子列表
          allRecommendedPosts.value = formattedPosts

          // 如果当前是"推荐"标签页，更新显示的帖子
          if (activeTab.value === 'recommend') {
            displayedPosts.value = formattedPosts
          }
          // eslint-disable-next-line no-console
          console.log('Formatted random posts:', formattedPosts)
        }
        // 如果API返回的是HTML或其他错误响应，可能是字符串类型
        else if (typeof result === 'string' && result.includes('<!DOCTYPE html>')) {
          throw new Error('API 返回了 HTML 页面而不是 JSON 数据，请检查 API 端点或服务器状态')
        }
        // 如果是对象而非数组，检查是否有data字段（可能是包装过的响应）
        else if (typeof result === 'object' && result !== null && 'data' in result && Array.isArray(result.data)) {
          const postsData = result.data
          // eslint-disable-next-line no-console
          console.log('Random posts data from nested object:', postsData) // 调试日志

          // 将响应数据转换为Post类型格式
          const formattedPosts: Post[] = postsData.map((post) => {
            // 确保正确处理图片数据
            let images: string[] = []

            // 检查是否有 filePaths 字段并且是数组
            if (post.filePaths && Array.isArray(post.filePaths) && post.filePaths.length > 0) {
              images = post.filePaths
            }
            else {
              images = ['https://placehold.co/600x400?text=暂无图片']
            }

            return {
              id: post.id || Math.random(),
              title: post.title || '无标题',
              content: post.content || '',
              publishTime: post.createdTime,
              username: post.author || '匿名用户',
              userAvatar: post.userAvatar || `https://placehold.co/40x40/007bff/ffffff?text=${(post.author || '匿名').charAt(0)}`,
              images,
              likes: post.voteCount || 0,
              commentCount: post.commentCount || 0,
              state: post.state || 'normal',
            }
          })

          // 更新推荐帖子列表
          allRecommendedPosts.value = formattedPosts

          // 如果当前是"推荐"标签页，更新显示的帖子
          if (activeTab.value === 'recommend') {
            displayedPosts.value = formattedPosts
          }
          // eslint-disable-next-line no-console
          console.log('Formatted random posts from nested object:', formattedPosts)
        }
        else {
          throw new TypeError('获取随机帖子失败: 响应格式不符合预期')
        }
      }
      catch (error) {
        console.error('获取随机帖子失败:', error)
        // 在获取随机帖子失败时，可以回退到使用原来的推荐帖子API
        try {
          // 尝试使用原来的列表API作为备选方案
          await fetchRecommendedPostsFallback()
        }
        catch (fallbackError) {
          console.error('获取推荐帖子失败:', fallbackError)
          uni.showToast({
            title: '获取帖子失败',
            icon: 'none',
          })
        }
      }
    }

    // 修改获取用户自己的帖子的函数
    const fetchMyPosts = async () => {
      try {
        // 直接从用户信息获取ID，参照home.vue的方式
        const userInfo = uni.getStorageSync('userInfo')
        let uid = userInfo?.userId || userInfo?.id

        // 如果没有，则尝试刷新获取
        if (!uid) {
          try {
            const refreshedInfo = await getUserInfo()
            uid = refreshedInfo?.id
          }
          catch (e) {
            console.error('获取用户信息失败:', e)
          }
        }

        // 如果还是获取不到用户ID，则提示用户
        if (!uid) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 使用正确的uid调用API
        const apiUrl: string = `${API_BASE_URL}/forum/post/user?uid=${uid}&page=${String(currentLoad.value)}`

        const response = await uni.request({
          url: apiUrl,
          method: 'GET',
          header: {
            'Authorization': uni.getStorageSync('token'),
            'content-type': 'application/json',
          },
        }) as unknown as {
          [0]: any
          [1]: { data: ApiResponse, statusCode: number }
        }

        const error = response[0]
        const responseData = response[1]

        if (error) {
          throw error
        }

        // 添加调试日志
        console.error('My posts response:', responseData.data)

        const apiResponse = responseData.data
        if (apiResponse.code === 200 && Array.isArray(apiResponse.data)) {
          // 转换数据格式
          const formattedPosts: Post[] = apiResponse.data.map(post => ({
            id: Number(post.id), // 确保强制转换为 number 类型
            title: post.title || '无标题',
            content: '', // 可以根据需要添加内容
            publishTime: post.createdTime,
            username: post.username || '匿名用户',
            userAvatar: post.userAvatarUrl || `https://via.placeholder.com/40?text=U${post.id}`,
            images: [],
            tags: [],
            likes: post.voteCount || 0,
            commentCount: post.commentCount || 0,
          }))

          // 更新状态
          allMyPosts.value = formattedPosts
          // 如果是"我的"标签页，更新显示的帖子
          if (activeTab.value === 'my') {
            displayedPosts.value = formattedPosts.slice(0, currentLoad.value * postsPerLoad)
          }

          // 添加调试日志
          console.error('Formatted posts:', formattedPosts)
          console.error('Current displayed posts:', displayedPosts.value)
        }
        else {
          throw new Error('获取我的帖子失败: 无效的响应格式')
        }
      }
      catch (error) {
        console.error('获取我的帖子失败:', error)
        uni.showToast({
          title: '获取我的帖子失败',
          icon: 'none',
        })
      }
    }

    // 修改收藏帖子的函数
    const fetchFavoritePosts = async () => {
      try {
        const favoriteUrl: string = '/forum/post/listFavorite'

        const response = await uni.request({
          url: favoriteUrl,
          method: 'GET',
          header: {
            Authorization: uni.getStorageSync('token'),
          },
        }) as unknown as {
          [0]: any
          [1]: { data: any, statusCode: number }
        }

        const error = response[0]
        const responseData = response[1]

        if (error) {
          throw error
        }

        if (responseData.data.code === 200) {
          const favoriteList = responseData.data.data || []
          allFavoritePosts.value = []
          for (const item of favoriteList) {
            const postUrl: string = `/forum/post/get?id=${item.postId}`

            const favoriteResponse = await uni.request({
              url: postUrl,
              method: 'GET',
              header: {
                Authorization: uni.getStorageSync('token'),
              },
            }) as unknown as {
              [0]: any
              [1]: { data: any, statusCode: number }
            }

            const getError = favoriteResponse[0]
            const postResponseData = favoriteResponse[1]

            if (getError) {
              throw getError
            }

            if (postResponseData.data.code === 200) {
              const postDetail = postResponseData.data.data
              const favoritePost: Post = {
                id: Number(postDetail.id), // 确保强制转换为 number 类型
                title: postDetail.title,
                content: postDetail.content || '',
                publishTime: postDetail.createdTime,
                username: postDetail.username || '匿名用户',
                userAvatar: postDetail.userAvatarUrl || 'https://via.placeholder.com/40',
                images: [],
                likes: postDetail.voteCount,
              }
              allFavoritePosts.value.push(favoritePost)
            }
          }
        }
      }
      catch (error) {
        uni.showToast({
          title: '获取收藏帖子失败',
          icon: 'none',
        })
        console.error('获取收藏帖子失败:', error)
      }
    }

    // 初始化加载推荐帖子
    const initializePosts = async () => {
      // 尝试获取用户ID
      try {
        // 参照home.vue的方式获取用户信息
        const userInfo = uni.getStorageSync('userInfo')

        // 打印日志便于调试
        // eslint-disable-next-line no-console
        console.log('初始化社区页面, 用户信息:', userInfo)
      }
      catch (e) {
        console.warn('获取用户信息失败:', e)
      }

      await fetchRandomPosts()
      displayedPosts.value = allRecommendedPosts.value.slice(0, postsPerLoad)
      currentLoad.value = 1
    }

    // 修改标签切换处理函数
    const handleTabChange = async (tab: 'recommend' | 'my' | 'favorites') => {
      console.error('Tab changed to:', tab) // 添加调试日志
      activeTab.value = tab
      currentLoad.value = 1 // 重置加载计数

      if (tab === 'recommend') {
        if (allRecommendedPosts.value.length === 0) {
          await fetchRandomPosts() // 使用随机帖子API
        }
        displayedPosts.value = allRecommendedPosts.value.slice(0, postsPerLoad)
      }
      else if (tab === 'my') {
        await fetchMyPosts() // 每次切换到"我的"标签页都重新获取数据
      }
      else if (tab === 'favorites') {
        await fetchFavoritePosts()
      }

      // 添加调试日志
      console.error('Current displayed posts after tab change:', displayedPosts.value)
    }

    // 下拉刷新
    const onRefresh = async () => {
      isRefreshing.value = true
      if (activeTab.value === 'recommend') {
        await fetchRandomPosts() // 使用随机帖子API
        displayedPosts.value = allRecommendedPosts.value.slice(0, currentLoad.value * postsPerLoad)
      }
      else if (activeTab.value === 'my') {
        await fetchMyPosts()
        displayedPosts.value = allMyPosts.value.slice(0, currentLoad.value * postsPerLoad)
      }
      else if (activeTab.value === 'favorites') {
        await fetchFavoritePosts()
        displayedPosts.value = allFavoritePosts.value.slice(0, currentLoad.value * postsPerLoad)
      }
      isRefreshing.value = false
    }

    // 滚动到底部加载更多
    const onLoadMore = async () => {
      if (activeTab.value === 'recommend') {
        const totalLoaded = currentLoad.value * postsPerLoad
        if (totalLoaded >= allRecommendedPosts.value.length)
          return
        currentLoad.value += 1
        displayedPosts.value = allRecommendedPosts.value.slice(0, currentLoad.value * postsPerLoad)
      }
      else if (activeTab.value === 'my') {
        const totalLoaded = currentLoad.value * postsPerLoad
        if (totalLoaded >= allMyPosts.value.length)
          return
        currentLoad.value += 1
        displayedPosts.value = allMyPosts.value.slice(0, currentLoad.value * postsPerLoad)
      }
    }

    // 搜索功能的处理
    const handleSearch = (query: string) => {
      // 实现搜索逻辑，这里是简单的搜索过滤
      if (activeTab.value === 'recommend') {
        displayedPosts.value = allRecommendedPosts.value.filter(post => post.title.includes(query)).slice(0, postsPerLoad)
      }
      else if (activeTab.value === 'my') {
        displayedPosts.value = allMyPosts.value.filter(post => post.title.includes(query)).slice(0, postsPerLoad)
      }
    }

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateBack()
    }

    // 初始化帖子
    initializePosts()

    const goToEdit = () => {
      uni.navigateTo({
        url: '/pages/community/posteditor',
      })
    }

    const handleDeletePost = (postId: number) => {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条帖子吗？',
        success: (res) => {
          if (res.confirm) {
            displayedPosts.value = displayedPosts.value.filter(post => post.id !== postId)
            // 可在此处调用 API 删除帖子
            uni.showToast({
              title: '删除成功',
              icon: 'success',
            })
          }
        },
      })
    }

    return {
      activeTab,
      displayedPosts,
      isRefreshing,
      handleBack,
      handleTabChange,
      handleSearch,
      handleDeletePost,
      onRefresh,
      onLoadMore,
      goToEdit,
    }
  },
})
</script>

<template>
  <!-- <view class="community-container"> -->
  <CommunityHeader @back="handleBack" @tab-change="handleTabChange" @search="handleSearch" />

  <!-- 推荐和我的页面内容 -->
  <scroll-view
    :scroll-y="true"
    :refreshing="isRefreshing"
    class="scroll-view"
    :lower-threshold="50"
    @refresher-refresh="onRefresh"
    @scrolltolower="onLoadMore"
  >
    <view class="posts-list grid grid-cols-2 mt-2 gap-2 lg:grid-cols-5 md:grid-cols-2">
      <PostCard
        v-for="post in displayedPosts"
        :key="`${activeTab}-${post.id}`"
        :post="post"
        :is-my-post="activeTab === 'my'"
        @delete="handleDeletePost"
      />
    </view>
  </scroll-view>

  <!-- 悬浮按钮 -->
  <view class="fixed bottom-4 right-4">
    <button
      class="h-16 w-16 flex items-center justify-center rounded-full bg-yellow text-white shadow-lg"
      @click="goToEdit"
    >
      <view class="i-mynaui:pen text-2xl" />
    </button>
  </view>
  <!-- </view> -->
</template>

<style scoped>
.scroll-view {
  flex: 1;
}
</style>

<route lang="json">
  {
    "layout": "default"
  }
</route>
