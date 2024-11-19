<script lang="ts">
import { defineComponent, ref } from 'vue'

interface Post {
  id: number
  title: string
  likes: number
  publishTime: string
  username: string
  userAvatar: string
  images?: string[]
}

export default defineComponent({
  name: 'Community',

  setup() {
    const activeTab = ref<'recommend' | 'my'>('recommend')
    const allRecommendedPosts = ref<Post[]>([])
    const allMyPosts = ref<Post[]>([])
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
          likes: Math.floor(Math.random() * 100),
          publishTime: new Date().toISOString().split('T')[0],
          username: `用户${i}`,
          userAvatar: `https://via.placeholder.com/40?text=U${i}`,
          images: [`https://via.placeholder.com/600x400?text=Image+${i}`],
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
          likes: Math.floor(Math.random() * 100),
          publishTime: new Date().toISOString().split('T')[0],
          username: `我`,
          userAvatar: `https://via.placeholder.com/40?text=Me`,
          images: [`https://via.placeholder.com/600x400?text=My+Image+${i}`],
        })
      }
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      allMyPosts.value.push(...newPosts)
    }

    // 初始化加载推荐帖子
    const initializePosts = async () => {
      await fetchRecommendedPosts()
      displayedPosts.value = allRecommendedPosts.value.slice(0, postsPerLoad)
      currentLoad.value = 1
    }

    // 切换标签时加载相应的帖子
    const handleTabChange = async (tab: 'recommend' | 'my') => {
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

    return {
      activeTab,
      displayedPosts,
      isRefreshing,
      handleBack,
      handleTabChange,
      handleSearch,
      onRefresh,
      onLoadMore,
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
    <view class="posts-list">
      <PostCard
        v-for="post in displayedPosts"
        :key="post.id"
        :post="post"
      />
    </view>
  </scroll-view>
  <!-- </view> -->
</template>

<style scoped>
/* .community-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
} */

.scroll-view {
  flex: 1;
}

.posts-list {
  padding: 1rem;
}
</style>
