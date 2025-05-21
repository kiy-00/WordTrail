<script lang="ts">
import type { Post } from '@/types/Post'
import { API_BASE_URL } from '@/config/api'
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

// 添加收藏项类型定义
interface FavoriteItem {
  id: string
  userId: string
  postId: string
  createTime?: string
  updateTime?: string
}

// 添加用户帖子类型定义
interface UserPost {
  id: string
  createdTime: string
  updatedTime: string
  title: string
  content: string
  userId: string
  username: string
  filePaths: string[]
  commentCount: number
  voteCount: number
  state: string
  userAvatar: string | null
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

        if (response.statusCode === 200 && typeof response.data === 'object' && response.data !== null) {
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

        // 获取响应数据
        const result = response.data

        // 添加类型检查，确保 result 是有效数据
        if (!result) {
          throw new Error('API 返回了空数据')
        }

        // 检查返回的是否是数组（新接口直接返回帖子数组）
        if (Array.isArray(result)) {
          // eslint-disable-next-line no-console
          console.log('Random posts data:', result) // 调试日志

          // 将响应数据转换为Post类型格式
          const formattedPosts: Post[] = result.map((post) => {
            // 处理图片数据
            let images: string[] = []

            // 使用 filePaths 字段（新接口中的图片字段）
            if (post.filePaths && Array.isArray(post.filePaths) && post.filePaths.length > 0) {
              images = post.filePaths
            }
            // 如果没有图片，使用占位图片
            else {
              images = ['https://placehold.co/600x400?text=暂无图片']
            }

            return {
              id: post.id, // 保持原始ID（字符串格式），不转换为数字
              title: post.title || '无标题',
              content: post.content || '',
              publishTime: post.createdTime,
              username: post.username || '匿名用户',
              userAvatar: post.userAvatar || `https://placehold.co/40x40/007bff/ffffff?text=${(post.username || '匿名').charAt(0)}`,
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
          console.log('Formatted random posts:', formattedPosts)
        }
        else if (typeof result === 'string' && result.includes('<!DOCTYPE html>')) {
          throw new Error('API 返回了 HTML 页面而不是 JSON 数据，请检查 API 端点或服务器状态')
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
        // 获取用户ID
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.userId || userInfo?.id

        if (!userId) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 修改: 使用新的API端点
        const apiUrl = `${API_BASE_URL}/forum/post/searchByUser?userId=${userId}`

        // eslint-disable-next-line no-console
        console.log('获取我的帖子URL:', apiUrl)

        // 使用Promise包装请求
        const response = await new Promise<any>((resolve, reject) => {
          uni.request({
            url: apiUrl,
            method: 'GET',
            header: {
              'Authorization': uni.getStorageSync('token'),
              'Content-Type': 'application/json',
            },
            success: (res: any) => {
              // eslint-disable-next-line no-console
              console.log('我的帖子响应:', res)
              resolve(res)
            },
            fail: (err) => {
              reject(err)
            },
          })
        })

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          const postsList = response.data.data as UserPost[]

          // 转换数据格式
          const formattedPosts: Post[] = postsList.map((post) => {
            // 处理图片数据
            let images: string[] = []

            if (post.filePaths && Array.isArray(post.filePaths) && post.filePaths.length > 0) {
              images = post.filePaths
            }
            else {
              // 如果没有图片，使用占位图
              images = ['https://placehold.co/600x400?text=暂无图片']
            }

            return {
              id: post.id,
              title: post.title || '无标题',
              content: post.content || '',
              publishTime: post.createdTime,
              username: post.username || '匿名用户',
              userAvatar: post.userAvatar || `https://placehold.co/40x40/007bff/ffffff?text=${(post.username || '匿名').charAt(0)}`,
              images,
              likes: post.voteCount || 0,
              commentCount: post.commentCount || 0,
              state: post.state || 'normal',
            }
          })

          // 更新状态
          allMyPosts.value = formattedPosts

          // 如果是"我的"标签页，更新显示的帖子
          if (activeTab.value === 'my') {
            displayedPosts.value = formattedPosts.slice(0, currentLoad.value * postsPerLoad)
          }

          // 添加调试日志
          // eslint-disable-next-line no-console
          console.log('我的帖子数量:', formattedPosts.length)
        }
        else {
          throw new Error(`获取我的帖子失败: ${response.data?.msg || '未知错误'}`)
        }
      }
      catch (error) {
        console.error('获取我的帖子失败:', error)
        uni.showToast({
          title: '获取我的帖子失败',
          icon: 'none',
        })

        // 如果失败，清空列表
        if (activeTab.value === 'my') {
          displayedPosts.value = []
        }
      }
    }

    // 修改收藏帖子的函数
    const fetchFavoritePosts = async () => {
      try {
        // 获取用户ID
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.userId || userInfo?.id

        if (!userId) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 修正: 使用完整的API URL并添加用户ID参数
        const favoriteUrl = `${API_BASE_URL}/forum/post/listFavorite?userId=${userId}`

        // 使用Promise包装请求，避免解构错误
        await new Promise((resolve, reject) => {
          uni.request({
            url: favoriteUrl,
            method: 'POST', // 确保使用POST方法
            header: {
              'Authorization': uni.getStorageSync('token'),
              'Content-Type': 'application/json',
            },
            success: (res: any) => { // 使用any绕过TypeScript检查
              // 调试日志
              // eslint-disable-next-line no-console
              console.log('收藏列表完整响应:', res)

              if (res.statusCode === 200 && res.data && res.data.code === 200) {
                const favoriteList = res.data.data || [] as FavoriteItem[]
                allFavoritePosts.value = []

                // 如果没有收藏记录，直接返回
                if (favoriteList.length === 0) {
                  displayedPosts.value = []
                  resolve(true) // 正常完成，没有数据
                  return
                }

                // 创建一个计数器，用于跟踪处理完成的请求数量
                let processedCount = 0
                const totalCount = favoriteList.length

                // 处理每个收藏项
                favoriteList.forEach((item: FavoriteItem) => {
                  // 确保item.postId存在
                  if (!item.postId) {
                    console.error('收藏项缺少postId:', item)
                    processedCount++
                    if (processedCount === totalCount) {
                      finishProcessing()
                    }
                    return
                  }

                  // 获取帖子详情
                  const postUrl = `${API_BASE_URL}/forum/post/get?id=${item.postId}`

                  uni.request({
                    url: postUrl,
                    method: 'GET',
                    header: {
                      'Authorization': uni.getStorageSync('token'),
                      'Content-Type': 'application/json',
                    },
                    success: (postRes: any) => { // 使用any绕过类型检查
                      processedCount++

                      if (postRes.statusCode === 200
                        && postRes.data
                        && postRes.data.code === 200) {
                        const postDetail = postRes.data.data
                        if (postDetail) {
                          // 处理图片数据
                          let images: string[] = []

                          // 使用filePaths字段，与随机帖子逻辑保持一致
                          if (postDetail.filePaths && Array.isArray(postDetail.filePaths) && postDetail.filePaths.length > 0) {
                            images = postDetail.filePaths
                          }
                          // 如果没有图片，添加占位图
                          else {
                            images = ['https://placehold.co/600x400?text=暂无图片']
                          }

                          // 创建帖子对象
                          const favoritePost: Post = {
                            id: postDetail.id,
                            title: postDetail.title || '无标题',
                            content: postDetail.content || '',
                            publishTime: postDetail.createdTime,
                            username: postDetail.username || '匿名用户',
                            userAvatar: postDetail.userAvatar || `https://placehold.co/40x40/007bff/ffffff?text=${(postDetail.username || '匿名').charAt(0)}`,
                            images, // 修复：添加处理后的图片数组变量
                            likes: postDetail.voteCount || 0,
                            commentCount: postDetail.commentCount || 0,
                            state: postDetail.state || 'normal',
                          }
                          allFavoritePosts.value.push(favoritePost)
                        }
                      }

                      // 检查是否所有请求都已处理完成
                      if (processedCount === totalCount) {
                        finishProcessing()
                      }
                    },
                    fail: (err) => {
                      console.error('获取帖子详情失败:', err)
                      processedCount++
                      if (processedCount === totalCount) {
                        finishProcessing()
                      }
                    },
                  })
                })

                // 处理完成后更新UI
                function finishProcessing() {
                  // 更新显示的帖子
                  if (activeTab.value === 'favorites') {
                    displayedPosts.value = allFavoritePosts.value.slice(0, currentLoad.value * postsPerLoad)
                    // eslint-disable-next-line no-console
                    console.log('收藏帖子列表获取完成:', allFavoritePosts.value.length)
                  }
                  resolve(true)
                }
              }
              else {
                console.error('收藏列表API返回错误:', res.data)
                reject(new Error(`获取收藏列表失败: ${res.data?.msg || '未知错误'}`))
              }
            },
            fail: (err) => {
              console.error('收藏列表请求失败:', err)
              reject(err)
            },
          })
        })
      }
      catch (error) {
        uni.showToast({
          title: '获取收藏帖子失败',
          icon: 'none',
        })
        console.error('获取收藏帖子失败:', error)

        // 如果失败，清空显示的帖子
        if (activeTab.value === 'favorites') {
          displayedPosts.value = []
        }
      }
    }

    // // 初始化加载推荐帖子
    // const initializePosts = async () => {
    //   // 尝试获取用户ID
    //   try {
    //     // 参照home.vue的方式获取用户信息
    //     const userInfo = uni.getStorageSync('userInfo')

    //     // 打印日志便于调试
    //     // eslint-disable-next-line no-console
    //     console.log('初始化社区页面, 用户信息:', userInfo)
    //   }
    //   catch (e) {
    //     console.warn('获取用户信息失败:', e)
    //   }

    //   await fetchRandomPosts()
    //   displayedPosts.value = allRecommendedPosts.value.slice(0, postsPerLoad)
    //   currentLoad.value = 1
    // }

    // 添加搜索结果存储
    const searchResults = ref<Post[]>([])
    const isSearchMode = ref(false)

    // 添加：通过API获取搜索结果
    const fetchSearchResults = async (keyword: string) => {
      try {
        if (!keyword.trim()) {
          return
        }

        // 进入搜索模式
        isSearchMode.value = true

        // 显示加载提示
        uni.showLoading({
          title: '搜索中...',
          mask: true,
        })

        // 调用搜索API
        const searchUrl = `${API_BASE_URL}/forum/post/search?keyword=${encodeURIComponent(keyword)}&page=1`

        // eslint-disable-next-line no-console
        console.log('搜索请求URL:', searchUrl)

        const response: UniApp.RequestSuccessCallbackResult = await uni.request({
          url: searchUrl,
          method: 'GET',
          header: {
            'Authorization': uni.getStorageSync('token'),
            'Content-Type': 'application/json',
          },
        })

        // eslint-disable-next-line no-console
        console.log('搜索结果响应:', response)

        if (response.statusCode === 200 && typeof response.data === 'object') {
          const result = response.data as { code: number, msg: string | null, data: UserPost[] }

          if (result.code === 200 && Array.isArray(result.data)) {
            // 转换搜索结果数据格式
            const formattedPosts: Post[] = result.data.map((post) => {
              // 处理图片数据
              let images: string[] = []

              if (post.filePaths && Array.isArray(post.filePaths) && post.filePaths.length > 0) {
                images = post.filePaths
              }
              else {
                // 如果没有图片，使用占位图
                images = ['https://placehold.co/600x400?text=暂无图片']
              }

              return {
                id: post.id,
                title: post.title || '无标题',
                content: post.content || '',
                publishTime: post.createdTime,
                username: post.username || '匿名用户',
                userAvatar: post.userAvatar || `https://placehold.co/40x40/007bff/ffffff?text=${(post.username || '匿名').charAt(0)}`,
                images,
                likes: post.voteCount || 0,
                commentCount: post.commentCount || 0,
                state: post.state || 'normal',
              }
            })

            searchResults.value = formattedPosts
            displayedPosts.value = formattedPosts

            // 显示搜索结果提示
            uni.showToast({
              title: `找到 ${formattedPosts.length} 条结果`,
              icon: 'none',
            })
          }
          else {
            searchResults.value = []
            displayedPosts.value = []
            uni.showToast({
              title: '未找到匹配结果',
              icon: 'none',
            })
          }
        }
        else {
          throw new Error(`搜索请求失败: ${response.statusCode}`)
        }
      }
      catch (error) {
        console.error('搜索失败:', error)
        uni.showToast({
          title: '搜索失败',
          icon: 'none',
        })
      }
      finally {
        uni.hideLoading()
      }
    }

    // 修改：搜索功能，使用API而不是本地过滤
    const handleSearch = (query: string) => {
      if (!query.trim())
        return

      // 调用API搜索
      fetchSearchResults(query)
    }

    // 修改：标签切换处理函数，退出搜索模式
    const handleTabChange = async (tab: 'recommend' | 'my' | 'favorites') => {
      // 退出搜索模式
      isSearchMode.value = false

      // 原有逻辑
      // eslint-disable-next-line no-console
      console.log('Tab changed to:', tab) // 添加调试日志
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
      // eslint-disable-next-line no-console
      console.log('Current displayed posts after tab change:', displayedPosts.value)
    }

    // 增加清除搜索结果的功能
    const clearSearch = () => {
      isSearchMode.value = false
      searchResults.value = []

      // 恢复当前标签页的帖子显示
      if (activeTab.value === 'recommend') {
        displayedPosts.value = allRecommendedPosts.value.slice(0, currentLoad.value * postsPerLoad)
      }
      else if (activeTab.value === 'my') {
        displayedPosts.value = allMyPosts.value.slice(0, currentLoad.value * postsPerLoad)
      }
      else if (activeTab.value === 'favorites') {
        displayedPosts.value = allFavoritePosts.value.slice(0, currentLoad.value * postsPerLoad)
      }
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

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateBack()
    }

    const goToEdit = () => {
      uni.navigateTo({
        url: '/pages/community/posteditor',
      })
    }

    const handleDeletePost = (postId: string | number) => {
      // 修改：确保使用toString()保留完整的ID字符串，而不是依赖强制类型转换
      // 这样即使传入数字化的ID也会正确处理
      const originalId = String(postId)

      // eslint-disable-next-line no-console
      console.log('准备删除帖子:')
      // eslint-disable-next-line no-console
      console.log('- 传入ID:', postId, '类型:', typeof postId)
      // eslint-disable-next-line no-console
      console.log('- 转换后ID:', originalId, '类型:', typeof originalId)

      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条帖子吗？',
        success: (res) => {
          if (res.confirm) {
            // 修改：直接使用originalId，不再尝试从displayedPosts中查找
            const deleteUrl = `${API_BASE_URL}/forum/post/delete`
            const deleteData = { id: originalId }

            // eslint-disable-next-line no-console
            console.log('删除帖子请求URL:', deleteUrl)
            // eslint-disable-next-line no-console
            console.log('删除帖子请求数据:', deleteData)

            // 调用删除API
            uni.request({
              url: deleteUrl,
              method: 'DELETE',
              data: deleteData,
              header: {
                'Authorization': uni.getStorageSync('token'),
                'Content-Type': 'application/json',
              },
              success: (res: any) => {
                // eslint-disable-next-line no-console
                console.log('删除帖子响应:', res)

                if (res.statusCode === 200) {
                  // 修改：从所有数据源中移除该帖子，而不仅仅是当前活动的数据源
                  displayedPosts.value = displayedPosts.value.filter(post => post.id !== postId)

                  // 无论当前是哪个标签页，都要更新所有数据源
                  allMyPosts.value = allMyPosts.value.filter(post => post.id !== postId)
                  allFavoritePosts.value = allFavoritePosts.value.filter(post => post.id !== postId)
                  allRecommendedPosts.value = allRecommendedPosts.value.filter(post => post.id !== postId)

                  uni.showToast({
                    title: '删除成功',
                    icon: 'success',
                  })
                }
                else {
                  uni.showToast({
                    title: '删除失败',
                    icon: 'none',
                  })
                }
              },
              fail: (err) => {
                console.error('删除帖子请求失败:', err)
                uni.showToast({
                  title: '删除请求失败',
                  icon: 'none',
                })
              },
            })
          }
        },
      })
    }

    return {
      activeTab,
      displayedPosts,
      isRefreshing,
      isSearchMode, // 添加到返回值
      handleBack,
      handleTabChange,
      handleSearch,
      handleDeletePost,
      onRefresh,
      onLoadMore,
      goToEdit,
      clearSearch, // 添加到返回值
    }
  },
})
</script>

<template>
  <!-- <view class="community-container"> -->
  <CommunityHeader @back="handleBack" @tab-change="handleTabChange" @search="handleSearch" />

  <!-- 添加搜索状态提示区域 -->
  <view v-if="isSearchMode" class="flex items-center justify-between bg-gray-100 px-4 py-2">
    <text class="text-sm text-gray-600">
      搜索结果
    </text>
    <view class="flex items-center" @click="clearSearch">
      <text class="mr-1 text-sm text-blue">
        清除
      </text>
      <view class="i-ci:close-small text-sm text-blue" />
    </view>
  </view>

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
