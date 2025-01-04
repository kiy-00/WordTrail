<script lang="ts">
import type { Post } from '@/types/Post'
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

    const fetchRecommendedPosts = async () => {
      try {
        const response: UniApp.RequestSuccessCallbackResult = await uni.request({
          url: `/forum/post/list?page=${String(currentLoad.value)}`,
          method: 'GET',
          header: {
            'Authorization': uni.getStorageSync('token'),
            'content-type': 'application/json',
          },
        })

        console.error('Response:', response) // 调试日志

        // H5环境下直接使用response，非H5环境下使用response[1]
        const result = response.data as ApiResponse
        console.error('Result:', result) // 调试日志

        if (!result) {
          throw new Error('未获取到响应数据')
        }

        if (result.code === 200) {
          console.error('Posts data:', result.data) // 调试日志
          const formattedPosts: Post[] = result.data.map(post => ({
            id: Number(post.id), // 确保强制转换为 number 类型
            title: post.title,
            content: '',
            publishTime: post.createdTime,
            username: post.username || '匿名用户',
            userAvatar: post.userAvatarUrl || `https://via.placeholder.com/40?text=U${post.id}`,
            images: [],
            tags: [],
            likes: post.voteCount,
            commentCount: post.commentCount,
          }))
          allRecommendedPosts.value.push(...formattedPosts)
        }
        else {
          throw new Error(result.msg || '获取帖子失败')
        }
      }
      catch (error) {
        console.error('Error details:', error)
        uni.showToast({
          title: '获取帖子失败',
          icon: 'none',
        })
      }
    }

    // 修改获取用户自己的帖子的函数
    const fetchMyPosts = async () => {
      try {
        const [error, response] = await uni.request({
          url: `/forum/post/user?uid=3&page=${String(currentLoad.value)}`,
          method: 'GET',
          header: {
            'Authorization': uni.getStorageSync('token'),
            'content-type': 'application/json',
          },
        }) as unknown as [any, { data: ApiResponse }]

        if (error) {
          throw error
        }

        // 添加调试日志
        console.error('My posts response:', response.data)

        const apiResponse = response.data
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

    // 模拟获取收藏的帖子
    const fetchFavoritePosts = async () => {
      try {
        const [error, response] = await uni.request({
          url: '/forum/post/listFavorite',
          method: 'GET',
          header: {
            Authorization: uni.getStorageSync('token'),
          },
        }) as unknown as [any, { data: any }]

        if (error) {
          throw error
        }

        if (response.data.code === 200) {
          const favoriteList = response.data.data || []
          allFavoritePosts.value = []
          for (const item of favoriteList) {
            const [getError, postResponse] = await uni.request({
              url: `/forum/post/get?id=${item.postId}`,
              method: 'GET',
              header: {
                Authorization: uni.getStorageSync('token'),
              },
            }) as unknown as [any, { data: any }]

            if (getError) {
              throw getError
            }

            if (postResponse.data.code === 200) {
              const postDetail = postResponse.data.data
              const favoritePost: Post = {
                id: Number(postDetail.id), // 确保强制转换为 number 类型
                title: postDetail.title,
                content: postDetail.content || '',
                publishTime: postDetail.createdTime,
                username: postDetail.username || '匿名用户',
                userAvatar: postDetail.userAvatarUrl || 'https://via.placeholder.com/40',
                images: [],
                tags: [],
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
      await fetchRecommendedPosts()
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
          await fetchRecommendedPosts()
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
        await fetchRecommendedPosts()
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
