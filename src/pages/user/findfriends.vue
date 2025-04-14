<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

// 用户接口定义 - 更新为与搜索API返回格式一致
interface User {
  id: string
  username: string
  avatar: string | null
  isFriend: boolean // 是否已经是好友
  hasSentRequest: boolean // API返回的是hasSentRequest，表示是否已发送请求
  hasReceivedRequest: boolean // 是否收到对方请求
}

export default defineComponent({
  name: 'FindFriendsPage',
  components: {
    BackButton,
  },
  setup() {
    const activeTab = ref('recommended') // 当前激活的标签：recommended或search
    const searchQuery = ref('')
    const isSearching = ref(false)
    const searchResults = ref<User[]>([])
    const recommendedFriends = ref<User[]>([])
    const isLoading = ref(true)
    const errorMessage = ref('')
    const showSearchBar = ref(false) // 是否显示搜索框

    const friendRequestMessage = ref('') // 添加好友留言
    const showMessageModal = ref(false) // 显示留言输入框
    const selectedUserId = ref('') // 当前选中的用户ID

    // 跳转到好友申请页面
    const navigateToFriendRequests = () => {
      uni.navigateTo({
        url: '/pages/user/myinfo',
      })
    }

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
          url: `${API_BASE_URL}/api/v1/friends/search?keyword=${encodeURIComponent(searchQuery.value)}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          searchResults.value = response.data as User[]

          // 搜索成功后切换到搜索结果标签
          activeTab.value = 'search'
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

    // 切换标签页
    const switchTab = (tab: string) => {
      activeTab.value = tab

      // 切换到搜索标签时显示搜索框
      if (tab === 'search') {
        showSearchBar.value = true
        if (searchQuery.value) {
          handleSearch() // 如果有搜索内容，自动执行搜索
        }
      }
      else {
        // 切换到推荐标签时隐藏搜索框
        // 但保留搜索内容和结果
        showSearchBar.value = false
      }
    }

    // 打开留言输入框
    const openMessageModal = (userId: string) => {
      selectedUserId.value = userId
      friendRequestMessage.value = '' // 清空之前的留言
      showMessageModal.value = true
    }

    // 关闭留言输入框
    const closeMessageModal = () => {
      showMessageModal.value = false
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

    // 获取用户状态 - 修复使用正确的字段名
    const getUserStatus = (user: User) => {
      if (user.isFriend)
        return 'friend'
      if (user.hasSentRequest) // 修正：使用API返回的hasSentRequest字段
        return 'pending'
      if (user.hasReceivedRequest)
        return 'received'
      return null // 可添加
    }

    // 添加调试帮助函数来检查状态
    const debugUserStatus = (user: User) => {
      // eslint-disable-next-line no-console
      console.log(`用户 ${user.username} 状态: isFriend=${user.isFriend}, hasSentRequest=${user.hasSentRequest}, 显示状态=${getUserStatus(user)}`)
      return getUserStatus(user)
    }

    // 添加好友
    const handleAddFriend = async (userId: string, message?: string) => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 构建请求URL和参数
        const url = `${API_BASE_URL}/api/v1/friends/request`
        const params = new URLSearchParams()
        params.append('receiverId', userId)
        if (message) {
          params.append('message', message)
        }

        const response = await uni.request({
          url: `${url}?${params.toString()}`,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        // 处理不同的响应状态
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
          // 处理各种错误情况
          let errorMessage = '添加好友失败'

          if (response.data && typeof response.data === 'object') {
            const data = response.data as any

            switch (data.code) {
              case 'USER_NOT_FOUND': {
                errorMessage = '用户不存在'
                break
              }
              case 'INVALID_REQUEST': {
                errorMessage = data.message || '不能添加自己为好友'
                break
              }
              case 'ALREADY_FRIENDS': {
                errorMessage = '你们已经是好友了'
                break
              }
              case 'REQUEST_PENDING': {
                errorMessage = '已发送过请求，等待对方处理中'

                // 更新UI状态为已发送请求
                const user = recommendedFriends.value.find(u => u.id === userId)
                if (user) {
                  user.hasSentRequest = true
                }
                const searchUser = searchResults.value.find(u => u.id === userId)
                if (searchUser) {
                  searchUser.hasSentRequest = true
                }
                break
              }
              default: {
                errorMessage = data.message || '添加好友失败'
              }
            }
          }

          uni.showToast({
            title: errorMessage,
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

    // 提交好友请求(包含留言)
    const submitFriendRequest = () => {
      if (!selectedUserId.value)
        return

      handleAddFriend(selectedUserId.value, friendRequestMessage.value)
      closeMessageModal()
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

    // 显示/隐藏搜索框
    const toggleSearchBar = () => {
      showSearchBar.value = !showSearchBar.value
      if (!showSearchBar.value) {
        searchQuery.value = ''
        searchResults.value = []
      }
    }

    onMounted(() => {
      fetchRecommendedFriends()
    })

    return {
      activeTab,
      searchQuery,
      isSearching,
      searchResults,
      recommendedFriends,
      isLoading,
      errorMessage,
      friendRequestMessage,
      showMessageModal,
      selectedUserId,
      showSearchBar,
      handleSearch,
      handleAddFriend,
      handleBack,
      clearSearch,
      getUserAvatar,
      getUserStatus,
      debugUserStatus, // 导出调试函数用于视图
      openMessageModal,
      closeMessageModal,
      submitFriendRequest,
      switchTab,
      toggleSearchBar,
      navigateToFriendRequests,
    }
  },
})
</script>

<template>
  <view class="find-friends px-4 py-4">
    <BackButton @back="handleBack" />

    <!-- 铃铛图标 - 添加在右上角，固定位置 -->
    <view
      class="fixed right-4 top-4 z-50 h-12 w-12 flex items-center justify-center rounded-full shadow-sm frosted-glass"
      @click="navigateToFriendRequests"
    >
      <view class="i-carbon:notification text-xl" />
    </view>

    <!-- 标题 -->
    <view class="mb-6 mt-10">
      <text class="text-2xl font-bold">
        查找好友
      </text>
    </view>

    <!-- 标签页切换 -->
    <view class="mb-6 flex rounded-full bg-gray-100 p-1">
      <view
        class="flex-1 rounded-full py-2 text-center transition-all"
        :class="[
          activeTab === 'recommended' ? 'bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
        ]"
        @click="switchTab('recommended')"
      >
        推荐好友
      </view>
      <view
        class="flex-1 rounded-full py-2 text-center transition-all"
        :class="[
          activeTab === 'search' ? 'bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
        ]"
        @click="switchTab('search')"
      >
        搜索好友
      </view>
    </view>

    <!-- 搜索框 - 只在搜索tab或点击搜索图标时显示 -->
    <view v-if="activeTab === 'search' || showSearchBar" class="mb-6 flex items-center gap-2">
      <!-- 搜索输入框 -->
      <view class="flex flex-1 items-center rounded-full bg-white/80 px-4 py-2 shadow-sm">
        <view class="i-carbon:search text-xl text-gray-500" />
        <input
          v-model="searchQuery"
          class="ml-2 flex-1 bg-transparent text-base"
          placeholder="输入用户名查找好友"
          @confirm="handleSearch"
        >
        <view v-if="searchQuery" class="i-carbon:close text-xl text-gray-500" @click="clearSearch" />
      </view>

      <!-- 搜索按钮 -->
      <button
        class="flex items-center rounded-full bg-yellow px-4 py-2.5 text-sm text-white shadow-sm"
        :disabled="isSearching"
        @click="handleSearch"
      >
        <view v-if="isSearching" class="i-carbon:progress-bar mr-1 animate-spin" />
        <text>{{ isSearching ? '搜索中...' : '搜索' }}</text>
      </button>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading && activeTab === 'recommended'" class="flex flex-col items-center justify-center py-8">
      <view class="i-carbon:progress-bar animate-spin text-2xl" />
      <text class="mt-2 block text-gray-600">
        加载中...
      </text>
    </view>

    <!-- 搜索中状态 -->
    <view v-else-if="isSearching && activeTab === 'search'" class="flex flex-col items-center justify-center py-8">
      <view class="i-carbon:progress-bar animate-spin text-2xl" />
      <text class="mt-2 block text-gray-600">
        搜索中...
      </text>
    </view>

    <!-- 推荐好友标签内容 -->
    <view v-else-if="activeTab === 'recommended'" class="space-y-4">
      <!-- 推荐好友列表 -->
      <view v-if="recommendedFriends.length > 0">
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
            <!-- 添加按钮/状态 -->
            <view v-if="getUserStatus(user) === 'friend'" class="text-sm text-green-500">
              已是好友
            </view>
            <view v-else-if="getUserStatus(user) === 'pending'" class="text-sm text-gray-500">
              请求已发送
            </view>
            <view v-else-if="getUserStatus(user) === 'received'" class="text-sm text-blue-500">
              接受请求
            </view>
            <view v-else>
              <button
                class="rounded-lg bg-yellow px-3 py-1.5 text-sm text-white shadow-sm"
                @click="openMessageModal(user.id)"
              >
                添加好友
              </button>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="py-8 text-center text-gray-500">
        暂无推荐好友
      </view>
    </view>

    <!-- 搜索好友标签内容 -->
    <view v-else-if="activeTab === 'search'" class="space-y-4">
      <!-- 搜索结果 -->
      <view v-if="searchResults.length > 0">
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
            <!-- 添加按钮/状态 -->
            <view v-if="getUserStatus(user) === 'friend'" class="text-sm text-green-500">
              已是好友
            </view>
            <view v-else-if="getUserStatus(user) === 'pending'" class="text-sm text-gray-500">
              请求已发送
            </view>
            <view v-else-if="getUserStatus(user) === 'received'" class="text-sm text-blue-500">
              接受请求
            </view>
            <view v-else>
              <button
                class="rounded-lg bg-yellow px-3 py-1.5 text-sm text-white shadow-sm"
                @click="openMessageModal(user.id)"
              >
                添加好友
              </button>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="py-8 text-center text-gray-500">
        {{ searchQuery ? '未找到相关用户' : '请输入关键词搜索用户' }}
      </view>
    </view>

    <!-- 提示 -->
    <view class="mt-8 border border-yellow/30 rounded-lg bg-yellow/10 p-4">
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

    <!-- 添加好友留言弹窗 -->
    <view v-if="showMessageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <view class="w-4/5 rounded-lg bg-white p-6">
        <text class="mb-4 block text-center text-xl font-bold">
          添加好友
        </text>

        <view class="mb-4">
          <text class="mb-2 block text-gray-700">
            留言(可选):
          </text>
          <textarea
            v-model="friendRequestMessage"
            class="w-full border border-gray-300 rounded-lg bg-white p-2 text-gray-700"
            placeholder="给对方打个招呼吧..."
            :maxlength="50"
          />
          <text class="mt-1 text-right text-xs text-gray-500">
            {{ friendRequestMessage.length }}/50
          </text>
        </view>

        <view class="flex justify-end space-x-3">
          <button
            class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700"
            @click="closeMessageModal"
          >
            取消
          </button>
          <button
            class="rounded-lg bg-yellow px-4 py-2 text-white"
            @click="submitFriendRequest"
          >
            发送请求
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<route lang="json">
{
  "layout": "default"
}
</route>
