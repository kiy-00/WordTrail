<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

// 用户接口定义 - 更新为与API返回格式一致
interface User {
  id: string // 服务器返回的是id而不是userId
  username: string
  avatar: string | null
  hasSentRequest: boolean // 是否已发送请求
  hasReceivedRequest: boolean // 是否已收到请求
}

export default defineComponent({
  name: 'FindFriendsPage',
  components: {
    BackButton,
  },
  setup() {
    const searchQuery = ref('')
    const isSearching = ref(false)
    const searchResults = ref<User[]>([])
    const recommendedFriends = ref<User[]>([])
    const isLoading = ref(true)
    const errorMessage = ref('')

    // 处理搜索
    const handleSearch = async () => {
      if (!searchQuery.value.trim()) {
        uni.showToast({
          title: '请输入搜索内容',
          icon: 'none',
        })
        return
      }

      isSearching.value = true
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/friends/search?username=${encodeURIComponent(searchQuery.value)}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          searchResults.value = response.data as User[]
        }
        else {
          console.error('搜索用户失败:', response)
          uni.showToast({
            title: '搜索失败，请稍后重试',
            icon: 'none',
          })
        }
      }
      catch (error) {
        console.error('搜索用户错误:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
        })
      }
      finally {
        isSearching.value = false
      }
    }

    // 获取推荐好友
    const fetchRecommendedFriends = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/friends/recommend?limit=10`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          recommendedFriends.value = response.data as User[]
          // eslint-disable-next-line no-console
          console.log('获取到推荐好友:', recommendedFriends.value)
        }
        else {
          console.error('获取推荐好友失败:', response)
        }
      }
      catch (error) {
        console.error('获取推荐好友错误:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 生成用户头像或默认首字母头像
    const getUserAvatar = (user: User) => {
      if (user.avatar)
        return user.avatar

      // 如果没有头像，返回用户名的第一个字符（大写）
      if (user.username && user.username.length > 0) {
        return user.username.charAt(0).toUpperCase()
      }

      // 如果都没有，返回默认头像
      return '/static/avatar/avatar.png'
    }

    // 获取用户状态
    const getUserStatus = (user: User) => {
      if (user.hasSentRequest)
        return 'pending'
      if (user.hasReceivedRequest)
        return 'received'
      return null // 可添加
    }

    // 添加好友
    const handleAddFriend = async (userId: string) => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/friends/request`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: {
            targetUserId: userId,
          },
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          uni.showToast({
            title: '好友请求已发送',
            icon: 'success',
          })

          // 更新状态为已发送请求
          const user = recommendedFriends.value.find(u => u.id === userId)
          if (user) {
            user.hasSentRequest = true
          }

          // 同样更新搜索结果中的状态
          const searchUser = searchResults.value.find(u => u.id === userId)
          if (searchUser) {
            searchUser.hasSentRequest = true
          }
        }
        else {
          uni.showToast({
            title: '添加好友失败',
            icon: 'none',
          })
        }
      }
      catch (error) {
        console.error('添加好友错误:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
        })
      }
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    // 清空搜索
    const clearSearch = () => {
      searchQuery.value = ''
      searchResults.value = []
    }

    onMounted(() => {
      fetchRecommendedFriends()
    })

    return {
      searchQuery,
      isSearching,
      searchResults,
      recommendedFriends,
      isLoading,
      errorMessage,
      handleSearch,
      handleAddFriend,
      handleBack,
      clearSearch,
      getUserAvatar,
      getUserStatus,
    }
  },
})
</script>

<template>
  <view class="find-friends px-4 py-4">
    <BackButton @back="handleBack" />

    <!-- 标题 -->
    <view class="mb-6 mt-10">
      <text class="text-2xl font-bold">
        查找好友
      </text>
    </view>

    <!-- 搜索框 -->
    <view class="mb-6">
      <view class="flex items-center rounded-full bg-white/80 px-4 py-2 shadow-sm">
        <view class="i-carbon:search text-xl text-gray-500" />
        <input
          v-model="searchQuery"
          class="ml-2 flex-1 bg-transparent text-base"
          placeholder="输入用户名查找好友"
          @confirm="handleSearch"
        >
        <view v-if="searchQuery" class="i-carbon:close text-xl text-gray-500" @click="clearSearch" />
      </view>
      <view class="mt-2 flex justify-end">
        <button
          class="flex items-center rounded-full bg-yellow px-4 py-1.5 text-sm text-white shadow-sm"
          :disabled="isSearching"
          @click="handleSearch"
        >
          <view v-if="isSearching" class="i-carbon:progress-bar mr-1 animate-spin" />
          <text>{{ isSearching ? '搜索中...' : '搜索' }}</text>
        </button>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="searchResults.length > 0" class="mb-6">
      <text class="mb-3 block text-lg text-gray-800 font-medium">
        搜索结果
      </text>
      <view class="space-y-3">
        <view
          v-for="user in searchResults"
          :key="user.id"
          class="flex items-center justify-between rounded-lg bg-white/80 p-3 shadow-sm"
        >
          <view class="flex items-center">
            <!-- 头像 -->
            <view class="h-12 w-12 flex items-center justify-center overflow-hidden rounded-full bg-gray-300">
              <image
                v-if="user.avatar"
                :src="user.avatar"
                mode="aspectFill"
                class="h-full w-full object-cover"
              />
              <text v-else class="text-xl text-white font-bold">
                {{ user.username.charAt(0).toUpperCase() }}
              </text>
            </view>
            <!-- 用户名 -->
            <view class="ml-3">
              <text class="block text-gray-800 font-medium">
                {{ user.username }}
              </text>
            </view>
          </view>
          <!-- 添加按钮 -->
          <view v-if="!getUserStatus(user)">
            <button
              class="rounded-lg bg-yellow px-3 py-1.5 text-sm text-white shadow-sm"
              @click="handleAddFriend(user.id)"
            >
              添加好友
            </button>
          </view>
          <view v-else-if="getUserStatus(user) === 'pending'" class="text-sm text-gray-500">
            请求已发送
          </view>
          <view v-else-if="getUserStatus(user) === 'received'" class="text-sm text-blue-500">
            接受请求
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading" class="flex flex-col items-center justify-center py-8">
      <view class="i-carbon:progress-bar animate-spin text-2xl" />
      <text class="mt-2 block text-gray-600">
        加载中...
      </text>
    </view>

    <!-- 推荐好友 -->
    <view v-else-if="recommendedFriends.length > 0" class="mt-4">
      <text class="mb-3 block text-lg text-gray-800 font-medium">
        推荐好友
      </text>
      <view class="space-y-3">
        <view
          v-for="user in recommendedFriends"
          :key="user.id"
          class="flex items-center justify-between rounded-lg bg-white/80 p-3 shadow-sm"
        >
          <view class="flex items-center">
            <!-- 头像 -->
            <view class="h-12 w-12 flex items-center justify-center overflow-hidden rounded-full bg-gray-300">
              <image
                v-if="user.avatar"
                :src="user.avatar"
                mode="aspectFill"
                class="h-full w-full object-cover"
              />
              <text v-else class="text-xl text-white font-bold">
                {{ user.username.charAt(0).toUpperCase() }}
              </text>
            </view>
            <!-- 用户名 -->
            <view class="ml-3">
              <text class="block text-gray-800 font-medium">
                {{ user.username }}
              </text>
            </view>
          </view>
          <!-- 添加按钮 -->
          <view v-if="!getUserStatus(user)">
            <button
              class="rounded-lg bg-yellow px-3 py-1.5 text-sm text-white shadow-sm"
              @click="handleAddFriend(user.id)"
            >
              添加好友
            </button>
          </view>
          <view v-else-if="getUserStatus(user) === 'pending'" class="text-sm text-gray-500">
            请求已发送
          </view>
          <view v-else-if="getUserStatus(user) === 'received'" class="text-sm text-blue-500">
            接受请求
          </view>
        </view>
      </view>
    </view>

    <!-- 无推荐好友 -->
    <view v-else class="py-8 text-center text-gray-500">
      暂无推荐好友
    </view>

    <!-- 提示 -->
    <view class="mt-6 border border-yellow/30 rounded-lg bg-yellow/10 p-4">
      <view class="flex">
        <view class="i-carbon:idea text-xl text-yellow" />
        <text class="ml-2 text-sm text-gray-700">
          <text class="font-medium">
            交友小贴士:
          </text>
          添加好友后，你们可以一起打卡学习，互相监督，共同进步！组队学习能够提高学习效率和坚持度。
        </text>
      </view>
    </view>
  </view>
</template>

<route lang="json">
{
  "layout": "default"
}
</route>
