<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { computed, defineComponent, onMounted, ref } from 'vue'

// 修改收到的好友请求接口定义以匹配API响应格式
interface ReceivedFriendRequest {
  requestId: number
  senderId: string
  senderUsername: string
  senderAvatar: string | null
  message: string | null
  createTime: string
  // status字段可能不在响应中，但我们可能需要它来处理UI状态
}

// 发送的好友请求接口定义 - 匹配API格式
interface SentFriendRequest {
  requestId: number
  receiverId: string
  receiverUsername: string
  receiverAvatar: string | null
  message: string | null
  status: string // 'accepted', 'pending', 'rejected'
  createTime: string
}

export default defineComponent({
  name: 'FriendRequestsPage',
  components: {
    BackButton,
  },
  setup() {
    const activeTab = ref('received') // 当前激活的标签：received或sent
    const isLoading = ref(true)
    const errorMessage = ref('')
    const receivedRequests = ref<ReceivedFriendRequest[]>([])
    const sentRequests = ref<SentFriendRequest[]>([])

    // 状态筛选
    const statusFilter = ref<string>('all') // 'all', 'pending', 'accepted', 'rejected'

    // 筛选后的发送请求列表
    const filteredSentRequests = computed(() => {
      if (statusFilter.value === 'all') {
        return sentRequests.value
      }
      return sentRequests.value.filter(request => request.status === statusFilter.value)
    })

    // 切换筛选状态
    const switchStatusFilter = (status: string) => {
      statusFilter.value = status
    }

    // 切换标签页
    const switchTab = (tab: string) => {
      activeTab.value = tab
    }

    // 获取收到的好友请求
    const fetchReceivedRequests = async () => {
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
          url: `/api/v1/friends/requests/received`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          receivedRequests.value = response.data as ReceivedFriendRequest[]
          // eslint-disable-next-line no-console
          console.log('获取到的收到请求:', receivedRequests.value)
        }
        else {
          console.error('获取收到的好友请求失败:', response)
        }
      }
      catch (error) {
        console.error('获取收到的好友请求出错:', error)
      }
    }

    // 获取发送的好友请求
    const fetchSentRequests = async () => {
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
          url: `/api/v1/friends/requests/sent`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          sentRequests.value = response.data as SentFriendRequest[]
          // eslint-disable-next-line no-console
          console.log('获取到的发送请求:', sentRequests.value)
        }
        else {
          console.error('获取发送的好友请求失败:', response)
        }
      }
      catch (error) {
        console.error('获取发送的好友请求出错:', error)
      }
    }

    // 处理好友请求 (接受或拒绝)
    const handleRequest = async (requestId: number, action: 'accept' | 'reject') => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 修改API路径以匹配后端实际API
        const url = `/api/v1/friends/request/${action}?requestId=${requestId}`

        const response = await uni.request({
          url,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          uni.showToast({
            title: action === 'accept' ? '已添加好友' : '已拒绝请求',
            icon: 'success',
          })

          // 刷新请求列表
          await fetchReceivedRequests()
        }
        else {
          uni.showToast({
            title: '操作失败，请稍后重试',
            icon: 'none',
          })
        }
      }
      catch (error) {
        console.error('处理好友请求出错:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
        })
      }
    }

    // 从日期字符串获取相对时间表示
    const getRelativeTime = (dateString: string) => {
      const now = new Date()
      const date = new Date(dateString)
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.round(diffMs / 1000)
      const diffMin = Math.round(diffSec / 60)
      const diffHour = Math.round(diffMin / 60)
      const diffDay = Math.round(diffHour / 24)

      if (diffSec < 60)
        return '刚刚'
      if (diffMin < 60)
        return `${diffMin}分钟前`
      if (diffHour < 24)
        return `${diffHour}小时前`
      if (diffDay < 7)
        return `${diffDay}天前`

      return date.toLocaleDateString()
    }

    // 生成用户头像或默认首字母头像
    const getUserAvatar = (user: { avatar: string | null, username: string }) => {
      if (user.avatar)
        return user.avatar

      // 如果没有头像，返回用户名的第一个字符（大写）
      if (user.username && user.username.length > 0) {
        return user.username.charAt(0).toUpperCase()
      }

      // 如果都没有，返回默认头像
      return '/static/avatar/avatar.png'
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    // 加载数据
    const loadData = async () => {
      isLoading.value = true
      try {
        await Promise.all([
          fetchReceivedRequests(),
          fetchSentRequests(),
        ])
      }
      catch (error) {
        errorMessage.value = '获取数据失败，请重试'
        console.error('加载数据失败:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      activeTab,
      isLoading,
      errorMessage,
      receivedRequests,
      sentRequests,
      statusFilter,
      filteredSentRequests,
      switchStatusFilter,
      switchTab,
      handleRequest,
      getRelativeTime,
      getUserAvatar,
      handleBack,
    }
  },
})
</script>

<template>
  <view class="friend-requests px-4 py-4">
    <BackButton @back="handleBack" />

    <!-- 标题 -->
    <view class="mb-6 mt-10">
      <text class="text-2xl font-bold">
        好友申请
      </text>
    </view>

    <!-- 标签页切换 -->
    <view class="mb-6 flex rounded-full bg-gray-100 p-1">
      <view
        class="flex-1 rounded-full py-2 text-center transition-all"
        :class="[
          activeTab === 'received' ? 'bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
        ]"
        @click="switchTab('received')"
      >
        收到的申请
      </view>
      <view
        class="flex-1 rounded-full py-2 text-center transition-all"
        :class="[
          activeTab === 'sent' ? 'bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
        ]"
        @click="switchTab('sent')"
      >
        发出的申请
      </view>
    </view>

    <!-- 状态筛选选项卡 - 仅在发出的申请标签页中显示 -->
    <view v-if="activeTab === 'sent'" class="mb-4 flex flex-wrap gap-2">
      <view
        class="cursor-pointer rounded-full px-3 py-1 transition-colors"
        :class="[statusFilter === 'all' ? 'bg-yellow text-white' : 'bg-gray-100 text-gray-700']"
        @click="switchStatusFilter('all')"
      >
        全部
      </view>
      <view
        class="cursor-pointer rounded-full px-3 py-1 transition-colors"
        :class="[statusFilter === 'pending' ? 'bg-yellow text-white' : 'bg-gray-100 text-gray-700']"
        @click="switchStatusFilter('pending')"
      >
        等待处理
      </view>
      <view
        class="cursor-pointer rounded-full px-3 py-1 transition-colors"
        :class="[statusFilter === 'accepted' ? 'bg-yellow text-white' : 'bg-gray-100 text-gray-700']"
        @click="switchStatusFilter('accepted')"
      >
        已接受
      </view>
      <view
        class="cursor-pointer rounded-full px-3 py-1 transition-colors"
        :class="[statusFilter === 'rejected' ? 'bg-yellow text-white' : 'bg-gray-100 text-gray-700']"
        @click="switchStatusFilter('rejected')"
      >
        已拒绝
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading" class="flex flex-col items-center justify-center py-8">
      <view class="i-carbon:progress-bar animate-spin text-2xl" />
      <text class="mt-2 block text-gray-600">
        加载中...
      </text>
    </view>

    <!-- 错误信息 -->
    <view v-else-if="errorMessage" class="rounded-lg bg-red-50 p-4 text-center text-red-500">
      {{ errorMessage }}
    </view>

    <!-- 收到的好友申请 -->
    <view v-else-if="activeTab === 'received'" class="space-y-4">
      <view v-if="receivedRequests.length === 0" class="py-8 text-center text-gray-500">
        暂无收到的好友申请
      </view>
      <view v-else class="space-y-4">
        <view
          v-for="request in receivedRequests"
          :key="request.requestId"
          class="rounded-lg bg-white/70 p-4 shadow-sm"
        >
          <view class="mb-3 flex items-center">
            <!-- 头像 -->
            <view class="h-12 w-12 flex items-center justify-center overflow-hidden rounded-full bg-gray-300">
              <image
                v-if="request.senderAvatar"
                :src="request.senderAvatar"
                mode="aspectFill"
                class="h-full w-full object-cover"
              />
              <text v-else class="text-xl text-white font-bold">
                {{ request.senderUsername.charAt(0).toUpperCase() }}
              </text>
            </view>
            <!-- 用户名和时间 -->
            <view class="ml-3 flex-1">
              <text class="block text-gray-800 font-medium">
                {{ request.senderUsername }}
              </text>
              <text class="text-xs text-gray-500">
                {{ getRelativeTime(request.createTime) }}
              </text>
            </view>
          </view>

          <!-- 留言 -->
          <view v-if="request.message" class="mb-3 rounded-lg bg-gray-50 px-3 py-2">
            <text class="text-sm text-gray-700">
              {{ request.message }}
            </text>
          </view>

          <!-- 操作按钮 -->
          <view class="flex justify-end space-x-3">
            <button
              class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700"
              @click="handleRequest(request.requestId, 'reject')"
            >
              拒绝
            </button>
            <button
              class="rounded-lg bg-yellow px-4 py-2 text-white"
              @click="handleRequest(request.requestId, 'accept')"
            >
              接受
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 发出的好友申请 - 使用筛选后的列表 -->
    <view v-else-if="activeTab === 'sent'" class="space-y-4">
      <view v-if="filteredSentRequests.length === 0" class="py-8 text-center text-gray-500">
        {{ statusFilter === 'all' ? '暂无发出的好友申请' : `暂无${statusFilter === 'pending' ? '等待处理' : statusFilter === 'accepted' ? '已接受' : '已拒绝'}的申请` }}
      </view>
      <view v-else class="space-y-4">
        <view
          v-for="request in filteredSentRequests"
          :key="request.requestId"
          class="rounded-lg bg-white/70 p-4 shadow-sm"
        >
          <view class="mb-3 flex items-center">
            <!-- 头像 -->
            <view class="h-12 w-12 flex items-center justify-center overflow-hidden rounded-full bg-gray-300">
              <image
                v-if="request.receiverAvatar"
                :src="request.receiverAvatar"
                mode="aspectFill"
                class="h-full w-full object-cover"
              />
              <text v-else class="text-xl text-white font-bold">
                {{ request.receiverUsername.charAt(0).toUpperCase() }}
              </text>
            </view>
            <!-- 用户名和时间 -->
            <view class="ml-3 flex-1">
              <text class="block text-gray-800 font-medium">
                {{ request.receiverUsername }}
              </text>
              <text class="text-xs text-gray-500">
                {{ getRelativeTime(request.createTime) }}
              </text>
            </view>
          </view>

          <!-- 留言 -->
          <view v-if="request.message" class="mb-3 rounded-lg bg-gray-50 px-3 py-2">
            <text class="text-sm text-gray-700">
              {{ request.message }}
            </text>
          </view>

          <!-- 状态和操作按钮 -->
          <view class="flex items-center justify-between">
            <text
              class="text-sm" :class="{
                'text-green-500': request.status === 'accepted',
                'text-red-500': request.status === 'rejected',
                'text-gray-500': request.status === 'pending',
              }"
            >
              {{ request.status === 'accepted' ? '已接受' : request.status === 'rejected' ? '已拒绝' : '等待中' }}
            </text>
          </view>
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
