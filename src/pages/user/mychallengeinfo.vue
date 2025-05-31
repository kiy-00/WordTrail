<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { defineComponent, onMounted, ref } from 'vue'

// 发出的挑战请求接口定义
interface SentChallengeRequest {
  challengeId: number
  name: string
  description: string | null
  dailyWordsTarget: number
  durationDays: number
  partnerId: string
  partnerUsername: string
  partnerAvatar: string | null
  requestDate: string
  startDate: string
  endDate: string
}

// 收到的挑战请求接口定义
interface ReceivedChallengeRequest {
  challengeId: number
  name: string
  description: string | null
  dailyWordsTarget: number
  durationDays: number
  creatorId: string
  creatorUsername: string
  creatorAvatar: string | null
  requestDate: string
  startDate: string
  endDate: string
}

export default defineComponent({
  name: 'MyChallengeInfo',
  components: {
    BackButton,
  },
  setup() {
    const activeTab = ref('sent') // 'sent' 或 'received'
    const sentChallenges = ref<SentChallengeRequest[]>([])
    const receivedChallenges = ref<ReceivedChallengeRequest[]>([])
    const isLoading = ref(true)
    const errorMessage = ref('')

    // 切换标签页
    const switchTab = (tab: string) => {
      activeTab.value = tab
    }

    // 获取发出的挑战
    const fetchSentChallenges = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({ title: '请先登录', icon: 'none' })
          return
        }

        const response = await uni.request({
          url: `/api/v1/team-challenges/requests/sent`,
          method: 'GET',
          header: { Authorization: `Bearer ${token}` },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          sentChallenges.value = response.data as SentChallengeRequest[]
          // eslint-disable-next-line no-console
          console.log('获取到的发出挑战:', sentChallenges.value)
        }
        else {
          console.error('获取发出的挑战失败:', response)
        }
      }
      catch (error) {
        console.error('获取发出的挑战出错:', error)
      }
    }

    // 获取收到的挑战
    const fetchReceivedChallenges = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({ title: '请先登录', icon: 'none' })
          return
        }

        const response = await uni.request({
          url: `/api/v1/team-challenges/requests/received`,
          method: 'GET',
          header: { Authorization: `Bearer ${token}` },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          receivedChallenges.value = response.data as ReceivedChallengeRequest[]
          // eslint-disable-next-line no-console
          console.log('获取到的收到挑战:', receivedChallenges.value)
        }
        else {
          console.error('获取收到的挑战失败:', response)
        }
      }
      catch (error) {
        console.error('获取收到的挑战出错:', error)
      }
    }

    // 处理挑战（接受/拒绝）
    const handleChallenge = async (challengeId: number, action: 'accept' | 'reject') => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({ title: '请先登录', icon: 'none' })
          return
        }

        // 更新API路径为正确的接受/拒绝挑战端点
        const url = `/api/v1/team-challenges/${challengeId}/${action}`

        // eslint-disable-next-line no-console
        console.log(`调用${action === 'accept' ? '接受' : '拒绝'}挑战API:`, url)

        const response = await uni.request({
          url,
          method: 'POST',
          header: { Authorization: `Bearer ${token}` },
        })

        if (response.statusCode === 200) {
          uni.showToast({
            title: action === 'accept' ? '已接受挑战' : '已拒绝挑战',
            icon: 'success',
          })
          // 刷新数据
          await fetchReceivedChallenges()
        }
        else {
          // 处理错误响应
          let errorMessage = action === 'accept' ? '接受挑战失败' : '拒绝挑战失败'

          if (response.data && typeof response.data === 'object' && 'message' in response.data) {
            errorMessage = (response.data as any).message || errorMessage
          }

          uni.showToast({
            title: errorMessage,
            icon: 'none',
          })
          console.error(`${action === 'accept' ? '接受' : '拒绝'}挑战失败:`, response)
        }
      }
      catch (error) {
        console.error('处理挑战请求出错:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
        })
      }
    }

    // 新增：确认拒绝挑战函数
    const confirmRejectChallenge = (challengeId: number) => {
      uni.showModal({
        title: '确认操作',
        content: '确认拒绝此挑战吗？',
        confirmText: '确认拒绝',
        confirmColor: '#FF0000',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户点击确认，执行拒绝操作
            handleChallenge(challengeId, 'reject')
          }
          // 用户点击取消，不执行任何操作
        },
      })
    }

    // 加载数据
    const loadData = async () => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        await Promise.all([
          fetchSentChallenges(),
          fetchReceivedChallenges(),
        ])
      }
      catch (error) {
        errorMessage.value = '获取数据失败，请重试'
        console.error('加载挑战数据失败:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    // 格式化日期显示
    const formatDate = (dateString: string | null) => {
      if (!dateString)
        return '未开始'
      // 如果是长日期格式，提取年月日部分
      if (dateString.includes('T')) {
        return dateString.split('T')[0]
      }
      return dateString
    }

    onMounted(() => {
      loadData()
    })

    return {
      activeTab,
      sentChallenges,
      receivedChallenges,
      isLoading,
      errorMessage,
      switchTab,
      handleChallenge,
      confirmRejectChallenge, // 导出新函数以便在模板中使用
      handleBack,
      formatDate,
    }
  },
})
</script>

<template>
  <view class="challenge-info-page px-4 py-4">
    <BackButton @back="handleBack" />

    <!-- 标题 -->
    <view class="mb-6 mt-10">
      <text class="text-2xl font-bold">
        组队挑战信息
      </text>
    </view>

    <!-- 标签页切换 -->
    <view class="mb-6 flex rounded-full bg-gray-100 p-1">
      <view
        class="flex-1 rounded-full py-2 text-center transition-all"
        :class="[
          activeTab === 'sent' ? 'bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
        ]"
        @click="switchTab('sent')"
      >
        发出的挑战
      </view>
      <view
        class="flex-1 rounded-full py-2 text-center transition-all"
        :class="[
          activeTab === 'received' ? 'bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
        ]"
        @click="switchTab('received')"
      >
        收到的挑战
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

    <!-- 发出的挑战 -->
    <view v-else-if="activeTab === 'sent'" class="space-y-4">
      <view v-if="sentChallenges.length === 0" class="py-8 text-center text-gray-500">
        暂无发出的挑战
      </view>
      <view v-else class="space-y-4">
        <view
          v-for="challenge in sentChallenges"
          :key="challenge.challengeId"
          class="rounded-lg bg-white/70 p-4 shadow-sm"
        >
          <text class="mb-2 block text-lg font-medium">
            {{ challenge.name }}
          </text>

          <view v-if="challenge.description" class="mb-2 rounded bg-gray-50 p-2 text-sm text-gray-700">
            {{ challenge.description }}
          </view>

          <view class="grid grid-cols-2 mb-2 gap-2">
            <view class="text-sm">
              <text class="text-gray-500">
                挑战对象:
              </text>
              <text>{{ challenge.partnerUsername || '未知' }}</text>
            </view>
            <view class="text-sm">
              <text class="text-gray-500">
                每日目标:
              </text>
              <text>{{ challenge.dailyWordsTarget }}词</text>
            </view>
            <view class="text-sm">
              <text class="text-gray-500">
                持续天数:
              </text>
              <text>{{ challenge.durationDays }}天</text>
            </view>
            <view class="text-sm">
              <text class="text-gray-500">
                发起日期:
              </text>
              <text>{{ formatDate(challenge.requestDate) }}</text>
            </view>
            <view v-if="challenge.startDate" class="col-span-2 text-sm">
              <text class="text-gray-500">
                挑战期间:
              </text>
              <text>{{ formatDate(challenge.startDate) }} 至 {{ formatDate(challenge.endDate) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 收到的挑战 -->
    <view v-else-if="activeTab === 'received'" class="space-y-4">
      <view v-if="receivedChallenges.length === 0" class="py-8 text-center text-gray-500">
        暂无收到的挑战
      </view>
      <view v-else class="space-y-4">
        <view
          v-for="challenge in receivedChallenges"
          :key="challenge.challengeId"
          class="rounded-lg bg-white/70 p-4 shadow-sm"
        >
          <text class="mb-2 block text-lg font-medium">
            {{ challenge.name }}
          </text>

          <view v-if="challenge.description" class="mb-2 rounded bg-gray-50 p-2 text-sm text-gray-700">
            {{ challenge.description }}
          </view>

          <view class="grid grid-cols-2 mb-2 gap-2">
            <view class="text-sm">
              <text class="text-gray-500">
                发起人:
              </text>
              <text>{{ challenge.creatorUsername || '未知' }}</text>
            </view>
            <view class="text-sm">
              <text class="text-gray-500">
                每日目标:
              </text>
              <text>{{ challenge.dailyWordsTarget }}词</text>
            </view>
            <view class="text-sm">
              <text class="text-gray-500">
                持续天数:
              </text>
              <text>{{ challenge.durationDays }}天</text>
            </view>
            <view class="text-sm">
              <text class="text-gray-500">
                发起日期:
              </text>
              <text>{{ formatDate(challenge.requestDate) }}</text>
            </view>
            <view v-if="challenge.startDate" class="col-span-2 text-sm">
              <text class="text-gray-500">
                挑战期间:
              </text>
              <text>{{ formatDate(challenge.startDate) }} 至 {{ formatDate(challenge.endDate) }}</text>
            </view>
          </view>

          <!-- 操作按钮 - 修改拒绝按钮的点击事件 -->
          <view class="mt-2 flex justify-end space-x-3">
            <button
              class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700"
              @click="confirmRejectChallenge(challenge.challengeId)"
            >
              拒绝
            </button>
            <button
              class="rounded-lg bg-yellow px-3 py-1.5 text-sm text-white"
              @click="handleChallenge(challenge.challengeId, 'accept')"
            >
              接受
            </button>
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
