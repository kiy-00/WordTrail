<script lang="ts">
import type { Post } from '@/types/Post'
import { defineComponent, ref } from 'vue'

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

    // 模拟获取推荐帖子的函数
    const fetchRecommendedPosts = async () => {
      // 这里应该调用实际的API接口，以下是模拟数据
      const newPosts: Post[] = []
      const startId = allRecommendedPosts.value.length + 1
      for (let i = startId; i < startId + postsPerLoad; i++) {
        newPosts.push({
          id: i,
          title: `推荐帖子标题 ${i}`,
          content: `这是推荐帖子 ${i} 的内容。`,
          publishTime: new Date().toISOString().split('T')[0],
          username: `用户${i}`,
          userAvatar: `https://via.placeholder.com/40?text=U${i}`,
          images: [`https://via.placeholder.com/600x400?text=Image+${i}`],
          tags: ['标签1', '标签2'],
          likes: Math.floor(Math.random() * 100), // 确保 likes 是 number 类型
        })
      }
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      allRecommendedPosts.value.push(...newPosts)
    }

    // 模拟获取用户自己的帖子的函数
    const fetchMyPosts = async () => {
      // 这里应该调用实际的API接口，以下是模拟数据
      const newPosts: Post[] = []
      const startId = allMyPosts.value.length + 1
      for (let i = startId; i < startId + postsPerLoad; i++) {
        newPosts.push({
          id: i,
          title: `我的帖子标题 ${i}`,
          content: `这是我的帖子 ${i} 的内容。`,
          publishTime: new Date().toISOString().split('T')[0],
          username: `我`,
          userAvatar: `https://via.placeholder.com/40?text=Me`,
          images: [`https://via.placeholder.com/600x400?text=My+Image+${i}`],
          tags: ['标签A', '标签B'],
          likes: Math.floor(Math.random() * 100), // 确保 likes 是 number 类型
          status: '审核中',
        })
      }
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      allMyPosts.value.push(...newPosts)
    }

    // 模拟获取收藏的帖子
    const fetchFavoritePosts = async () => {
      const newPosts: Post[] = []
      const startId = allFavoritePosts.value.length + 1
      for (let i = startId; i < startId + postsPerLoad; i++) {
        newPosts.push({
          id: i,
          title: `收藏帖子标题 ${i}`,
          content: `这是收藏帖子 ${i} 的内容。`,
          publishTime: new Date().toISOString().split('T')[0],
          username: `用户${i}`,
          userAvatar: `https://via.placeholder.com/40?text=U${i}`,
          images: [`https://via.placeholder.com/600x400?text=Favories+Image+${i}`],
          tags: ['标签1'],
          likes: 0,
          collects: 1,
        })
      }
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      allFavoritePosts.value.push(...newPosts)
    }

    // 初始化加载推荐帖子
    const initializePosts = async () => {
      await fetchRecommendedPosts()
      displayedPosts.value = allRecommendedPosts.value.slice(0, postsPerLoad)
      currentLoad.value = 1
    }

    // 切换标签时加载相应的帖子
    const handleTabChange = async (tab: 'recommend' | 'my' | 'favorites') => {
      activeTab.value = tab
      displayedPosts.value = []
      currentLoad.value = 1
      if (tab === 'recommend') {
        if (allRecommendedPosts.value.length === 0) {
          await fetchRecommendedPosts()
        }
        displayedPosts.value = allRecommendedPosts.value.slice(0, postsPerLoad)
      }
      else if (tab === 'my') {
        if (allMyPosts.value.length === 0) {
          await fetchMyPosts()
        }
        displayedPosts.value = allMyPosts.value.slice(0, postsPerLoad)
      }
      else if (tab === 'favorites') {
        if (allFavoritePosts.value.length === 0) {
          await fetchFavoritePosts()
        }
        displayedPosts.value = allFavoritePosts.value.slice(0, postsPerLoad)
      }
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
        :key="post.id"
        :post="post"
        :is-my-post="activeTab === 'my'"
        @delete="handleDeletePost"
      />
    </view>
  </scroll-view>

  <!-- 悬浮按钮 -->
  <view class="fixed bottom-4 right-4">
    <button
      class="h-16 w-16 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
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
