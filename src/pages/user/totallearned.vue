<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { defineComponent, onMounted, ref } from 'vue'

// 定义学习统计响应接口
interface LearningStatsResponse {
  totalWords: number
  masteredWords: number
  learningWords: number
  averageProficiency: number
}

export default defineComponent({
  name: 'TotalLearned',
  components: {
    BackButton,
  },
  setup() {
    const isLoading = ref(true)
    const errorMessage = ref('')
    const stats = ref<LearningStatsResponse>({
      totalWords: 0,
      masteredWords: 0,
      learningWords: 0,
      averageProficiency: 0,
    })

    // 从storage中获取用户ID
    const userId = ref(uni.getStorageSync('userInfo')?.userId || 'ed62add4-bf40-4246-b7ab-2555015b383b')

    // 日期范围 - 默认为过去30天
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const startDate = ref(thirtyDaysAgo.toISOString())
    const endDate = ref(today.toISOString())

    // 获取学习统计
    const fetchLearningStats = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''

        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 修正API路径：使用查询参数传递用户ID
        const url = `/api/v1/learning/stats?userId=${encodeURIComponent(userId.value)}`

        // 日志记录请求URL
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

        // 记录完整响应
        // eslint-disable-next-line no-console
        console.log('学习统计响应:', response)

        if (response.statusCode === 200 && response.data) {
          stats.value = response.data as LearningStatsResponse
          // eslint-disable-next-line no-console
          console.log('获取到的学习统计:', stats.value)
        }
        else {
          errorMessage.value = `获取学习统计失败: ${response.statusCode}`
          console.error('获取学习统计失败:', response)
        }
      }
      catch (error) {
        errorMessage.value = '网络错误，请稍后再试'
        console.error('获取学习统计错误:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 计算掌握率百分比
    const masteryPercentage = computed(() => {
      if (stats.value.totalWords === 0)
        return 0
      return (stats.value.masteredWords / stats.value.totalWords * 100).toFixed(1)
    })

    // 计算学习中的单词百分比
    const learningPercentage = computed(() => {
      if (stats.value.totalWords === 0)
        return 0
      return (stats.value.learningWords / stats.value.totalWords * 100).toFixed(1)
    })

    // 计算未开始学习的单词百分比
    const notStartedPercentage = computed(() => {
      if (stats.value.totalWords === 0)
        return 0
      const notStarted = stats.value.totalWords - stats.value.masteredWords - stats.value.learningWords
      return (notStarted / stats.value.totalWords * 100).toFixed(1)
    })

    // 计算未开始学习的单词数量
    const notStartedWords = computed(() => {
      return stats.value.totalWords - stats.value.masteredWords - stats.value.learningWords
    })

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    // 在组件挂载时获取数据
    onMounted(() => {
      fetchLearningStats()
    })

    return {
      isLoading,
      errorMessage,
      stats,
      startDate,
      endDate,
      masteryPercentage,
      learningPercentage,
      notStartedPercentage,
      notStartedWords,
      handleBack,
      fetchLearningStats,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <view class="p-4 pt-16">
    <view class="mb-6 text-center">
      <text class="text-2xl font-bold">
        学习统计
      </text>
      <text class="mt-1 block text-sm text-gray-500">
        过去30天的学习情况
      </text>
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

    <!-- 统计数据展示 -->
    <view v-else class="space-y-6">
      <!-- 数据卡片 -->
      <view class="grid grid-cols-2 gap-4">
        <view class="rounded-lg bg-white/70 p-4 shadow-sm backdrop-blur-sm">
          <view class="flex items-center">
            <view class="i-carbon:notebook text-2xl text-yellow" />
            <text class="ml-2 text-sm text-gray-600">
              总单词量
            </text>
          </view>
          <text class="mt-2 block text-2xl font-bold">
            {{ stats.totalWords }}
          </text>
        </view>

        <view class="rounded-lg bg-white/70 p-4 shadow-sm backdrop-blur-sm">
          <view class="flex items-center">
            <view class="i-carbon:checkmark-filled text-2xl text-green-500" />
            <text class="ml-2 text-sm text-gray-600">
              已掌握
            </text>
          </view>
          <text class="mt-2 block text-2xl font-bold">
            {{ stats.masteredWords }}
          </text>
        </view>

        <view class="rounded-lg bg-white/70 p-4 shadow-sm backdrop-blur-sm">
          <view class="flex items-center">
            <view class="i-carbon:in-progress text-2xl text-blue-500" />
            <text class="ml-2 text-sm text-gray-600">
              学习中
            </text>
          </view>
          <text class="mt-2 block text-2xl font-bold">
            {{ stats.learningWords }}
          </text>
        </view>

        <view class="rounded-lg bg-white/70 p-4 shadow-sm backdrop-blur-sm">
          <view class="flex items-center">
            <view class="i-carbon:hourglass text-2xl text-gray-500" />
            <text class="ml-2 text-sm text-gray-600">
              未开始
            </text>
          </view>
          <text class="mt-2 block text-2xl font-bold">
            {{ notStartedWords }}
          </text>
        </view>
      </view>

      <!-- 进度条 -->
      <view class="rounded-lg bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <text class="mb-3 block text-base text-gray-700 font-medium">
          学习进度
        </text>

        <view class="mb-5 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <!-- 已掌握部分 -->
          <view
            class="h-full bg-green-500"
            :style="{ width: `${masteryPercentage}%` }"
          />
        </view>

        <view class="mb-5">
          <view class="mb-2 flex justify-between">
            <text class="text-sm text-gray-700 font-medium">
              平均熟练度
            </text>
            <text class="text-sm text-yellow font-semibold">
              {{ (stats.averageProficiency * 100).toFixed(1) }}%
            </text>
          </view>
          <view class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <view
              class="h-full bg-yellow"
              :style="{ width: `${stats.averageProficiency * 100}%` }"
            />
          </view>
        </view>

        <!-- 统计细节 -->
        <view class="flex flex-col space-y-3">
          <view class="flex items-center">
            <view class="h-3 w-3 rounded-full bg-green-500" />
            <text class="ml-2 text-sm text-gray-600">
              已掌握: {{ masteryPercentage }}% ({{ stats.masteredWords }} 个单词)
            </text>
          </view>

          <view class="flex items-center">
            <view class="h-3 w-3 rounded-full bg-blue-500" />
            <text class="ml-2 text-sm text-gray-600">
              学习中: {{ learningPercentage }}% ({{ stats.learningWords }} 个单词)
            </text>
          </view>

          <view class="flex items-center">
            <view class="h-3 w-3 rounded-full bg-gray-400" />
            <text class="ml-2 text-sm text-gray-600">
              未开始: {{ notStartedPercentage }}% ({{ notStartedWords }} 个单词)
            </text>
          </view>
        </view>
      </view>

      <!-- 分析建议 -->
      <view class="rounded-lg bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <text class="mb-3 block text-base text-gray-700 font-medium">
          学习建议
        </text>

        <view v-if="stats.masteredWords / stats.totalWords < 0.3" class="rounded-lg bg-blue-50 p-3 text-blue-700">
          <view class="i-carbon:information mb-1 text-lg" />
          <text class="text-sm">
            你的学习旅程刚刚开始！每天花5分钟，坚持学习，进步会越来越明显。
          </text>
        </view>

        <view v-else-if="stats.masteredWords / stats.totalWords < 0.7" class="rounded-lg bg-blue-50 p-3 text-blue-700">
          <view class="i-carbon:information mb-1 text-lg" />
          <text class="text-sm">
            不错的进步！保持这个节奏，继续复习已学单词，挑战更多新词汇。
          </text>
        </view>

        <view v-else class="rounded-lg bg-green-50 p-3 text-green-700">
          <view class="i-carbon:checkmark mb-1 text-lg" />
          <text class="text-sm">
            太棒了！你已经掌握了大部分单词，可以考虑开始新的词书挑战。
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 添加动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.grid {
  animation: fadeIn 0.5s ease;
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
