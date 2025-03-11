<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

// 定义学习记录统计接口
interface LearningStats {
  totalLearnedWords: number
  totalReviewedWords: number
  averageSuccessRate: number
  consecutiveDays: number
  totalLearningTime: number
  dailyAverageWords: number
}

// 定义streak响应数据接口
interface StreakResponse {
  streak?: number
  consecutiveDays?: number
}

// 定义带有content属性的响应数据接口
interface ContentResponse {
  content: any
  [key: string]: any
}

export default defineComponent({
  name: 'MyDataPage',
  components: {
    BackButton,
  },
  setup() {
    const isLoading = ref(true)
    const errorMessage = ref('')
    const userId = ref(uni.getStorageSync('userInfo')?.userId || 'ed62add4-bf40-4246-b7ab-2555015b383b')

    // 连续学习天数
    const streak = ref(0)

    // 学习统计数据
    const stats = ref<LearningStats>({
      totalLearnedWords: 0,
      totalReviewedWords: 0,
      averageSuccessRate: 0,
      consecutiveDays: 0,
      totalLearningTime: 0,
      dailyAverageWords: 0,
    })

    // 计算过去一个月的日期范围
    const getDateRange = () => {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)

      return {
        startDate: `${startDate.toISOString().split('T')[0]}T00:00:00.000Z`,
        endDate: `${endDate.toISOString().split('T')[0]}T23:59:59.999Z`,
      }
    }

    // 获取连续学习天数
    const fetchStreak = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const url = `${API_BASE_URL}/api/v1/learning-records/${userId.value}/streak`

        const response = await uni.request({
          url,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200) {
          // 如果响应是一个数字，直接使用
          if (typeof response.data === 'number') {
            streak.value = response.data
          }
          // 如果响应是一个对象，查找连续天数字段
          else if (typeof response.data === 'object' && response.data !== null) {
            // 使用类型断言解决类型检查错误
            const data = response.data as StreakResponse
            streak.value = data.streak || data.consecutiveDays || 0
          }

          // eslint-disable-next-line no-console
          console.log('获取到的连续学习天数:', streak.value)
        }
        else {
          console.error('获取连续学习天数失败:', response)
        }
      }
      catch (error) {
        console.error('获取连续学习天数错误:', error)
      }
    }

    // 获取学习统计数据
    const fetchLearningStats = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const { startDate, endDate } = getDateRange()
        const url = `${API_BASE_URL}/api/v1/learning-records/${userId.value}/stats?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`

        // eslint-disable-next-line no-console
        console.log('请求学习统计数据:', url)

        const response = await uni.request({
          url,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200 && response.data) {
          // 如果response.data是字符串，尝试解析为JSON
          if (typeof response.data === 'string') {
            try {
              const parsedData = JSON.parse(response.data)
              stats.value = (parsedData.content || parsedData) as unknown as LearningStats
            }
            catch (e) {
              console.error('解析响应数据失败:', e)
              errorMessage.value = '解析数据失败'
            }
          }
          // 如果response.data有content属性，需要使用类型断言
          else if (typeof response.data === 'object' && response.data !== null) {
            const data = response.data as ContentResponse
            if (data.content) {
              stats.value = data.content as unknown as LearningStats
            }
            else {
              stats.value = response.data as unknown as LearningStats
            }
          }
          // eslint-disable-next-line no-console
          console.log('获取到的学习统计:', stats.value)
        }
        else {
          errorMessage.value = '获取学习统计失败'
          console.error('获取学习统计失败:', response)
        }
      }
      catch (error) {
        errorMessage.value = '网络错误，请稍后再试'
        console.error('获取学习统计错误:', error)
      }
    }

    // 初始化数据
    const initData = async () => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        // 并行发起两个请求
        await Promise.all([fetchStreak(), fetchLearningStats()])
      }
      catch (error) {
        errorMessage.value = '获取数据失败，请重试'
        console.error('初始化数据失败:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    // 刷新数据
    const refreshData = () => {
      initData()
    }

    // 查看详细统计
    const viewDetailedStats = () => {
      uni.navigateTo({ url: '/pages/user/totallearned' })
    }

    // 格式化时间（将秒转换为时:分）
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)

      return `${hours}小时${minutes}分钟`
    }

    onMounted(() => {
      initData()
    })

    return {
      isLoading,
      errorMessage,
      streak,
      stats,
      formatTime,
      handleBack,
      refreshData,
      viewDetailedStats,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <!-- 标题 -->
  <view class="mb-6 mt-10 flex items-center justify-between">
    <text class="text-2xl font-bold">
      我的学习数据
    </text>
    <view
      class="h-10 w-10 flex cursor-pointer items-center justify-center rounded-full bg-white/80"
      @click="refreshData"
    >
      <view class="i-mynaui:refresh text-xl text-gray-700" />
    </view>
  </view>

  <!-- 加载状态 -->
  <view v-if="isLoading" class="flex flex-col items-center justify-center py-10">
    <view class="i-carbon:progress-bar animate-spin text-2xl" />
    <text class="mt-2 block text-gray-600">
      加载中...
    </text>
  </view>

  <!-- 错误信息 -->
  <view v-else-if="errorMessage" class="rounded-lg bg-red-50 p-4 text-center text-red-500">
    {{ errorMessage }}
  </view>

  <!-- 数据展示 -->
  <view v-else class="space-y-6">
    <!-- 连续学习天数卡片 -->
    <view class="relative overflow-hidden rounded-xl from-yellow to-amber-400 bg-gradient-to-r p-5 shadow-md">
      <view class="relative z-10">
        <text class="mb-1 block text-lg font-medium">
          当前连续学习
        </text>
        <view class="flex items-baseline">
          <text class="text-4xl font-bold">
            {{ streak }}
          </text>
          <text class="ml-2 text-xl">
            天
          </text>
        </view>
        <text class="mt-2 block text-sm">
          继续保持，不要中断你的学习记录！
        </text>
      </view>
      <!-- 背景装饰 -->
      <view class="absolute bottom-0 right-0 opacity-20">
        <view class="i-carbon:calendar-heat-map text-6xl" />
      </view>
    </view>

    <!-- 本月学习概览 -->
    <view class="rounded-xl bg-white/70 p-5 shadow-sm backdrop-blur-sm">
      <text class="mb-4 block text-lg text-gray-800 font-medium">
        过去30天学习概览
      </text>

      <view class="grid grid-cols-2 gap-4">
        <!-- 已学单词 -->
        <view class="rounded-lg bg-blue-50 p-4">
          <view class="flex items-center">
            <view class="i-carbon:book text-xl text-blue-500" />
            <text class="ml-2 text-sm text-gray-600">
              已学单词
            </text>
          </view>
          <text class="mt-1 block text-2xl text-gray-800 font-bold">
            {{ stats.totalLearnedWords }}
          </text>
        </view>

        <!-- 已复习 -->
        <view class="rounded-lg bg-green-50 p-4">
          <view class="flex items-center">
            <view class="i-carbon:review text-xl text-green-500" />
            <text class="ml-2 text-sm text-gray-600">
              已复习单词
            </text>
          </view>
          <text class="mt-1 block text-2xl text-gray-800 font-bold">
            {{ stats.totalReviewedWords }}
          </text>
        </view>

        <!-- 记忆成功率 -->
        <view class="rounded-lg bg-purple-50 p-4">
          <view class="flex items-center">
            <view class="i-carbon:chart-radar text-xl text-purple-500" />
            <text class="ml-2 text-sm text-gray-600">
              记忆成功率
            </text>
          </view>
          <text class="mt-1 block text-2xl text-gray-800 font-bold">
            {{ (stats.averageSuccessRate * 100).toFixed(1) }}%
          </text>
        </view>

        <!-- 日均学习 -->
        <view class="rounded-lg bg-orange-50 p-4">
          <view class="flex items-center">
            <view class="i-carbon:chart-bar text-xl text-orange-500" />
            <text class="ml-2 text-sm text-gray-600">
              日均学习
            </text>
          </view>
          <text class="mt-1 block text-2xl text-gray-800 font-bold">
            {{ stats.dailyAverageWords }}词
          </text>
        </view>
      </view>
    </view>

    <!-- 查看更多按钮 -->
    <view class="mt-4 flex justify-center">
      <view
        class="cursor-pointer rounded-lg bg-yellow px-6 py-3 text-white font-semibold shadow-sm transition-all active:scale-98"
        @click="viewDetailedStats"
      >
        查看详细学习统计
      </view>
    </view>

    <!-- 激励文案 -->
    <view class="mt-6 border border-yellow/30 rounded-lg bg-yellow/10 p-4">
      <view class="flex">
        <view class="i-carbon:idea text-xl text-yellow" />
        <text class="ml-2 text-sm text-gray-700">
          <text class="font-medium">
            学习小贴士:
          </text>
          坚持每日学习和复习，能够有效提高单词记忆效果。即使只有5分钟，也比不学习要好！
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 渐变背景 */
.bg-gradient-to-r {
  background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to));
}

/* 按钮按下效果 */
.active\:scale-98:active {
  transform: scale(0.98);
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
