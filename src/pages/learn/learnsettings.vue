<script lang="ts">
import type { LearnSettings } from '@/utils/learnSettingsStorage'
import { API_BASE_URL } from '@/config/api'
import { LearnSettingsStorage } from '@/utils/learnSettingsStorage'
import { defineComponent, onMounted, ref } from 'vue'

// 学习目标接口定义
interface LearningGoal {
  id: string
  userId: string
  dailyNewWordsGoal: number
  dailyReviewWordsGoal: number
  createdAt: string
  updatedAt: string
}

export default defineComponent({
  name: 'LearnSettings',

  setup() {
    // 单词数量选项
    const wordsPerGroupOptions = [
      { value: 10, text: '10 个' },
      { value: 15, text: '15 个' },
      { value: 20, text: '20 个' },
      { value: 25, text: '25 个' },
    ]

    // 每日目标选项 - 从0到100，每10个一组
    const dailyGoalOptions = Array.from({ length: 11 }, (_, i) => {
      const value = i * 10
      return { value, text: `${value} 个` }
    })

    // 当前设置
    const currentSettings = ref<LearnSettings>(LearnSettingsStorage.getSettings())

    // 是否正在保存
    const isSaving = ref(false)

    // 是否正在加载
    const isLoading = ref(false)

    // 选中的单词数量索引
    const selectedWordsPerGroupIndex = ref(
      wordsPerGroupOptions.findIndex(option => option.value === currentSettings.value.wordsPerGroup),
    )

    // 选中的每日新词目标索引
    const selectedNewWordsGoalIndex = ref(
      dailyGoalOptions.findIndex(option => option.value === currentSettings.value.dailyNewWordsGoal) || 1,
    )

    // 选中的每日复习目标索引
    const selectedReviewWordsGoalIndex = ref(
      dailyGoalOptions.findIndex(option => option.value === currentSettings.value.dailyReviewWordsGoal) || 2,
    )

    // 处理单词数量变更
    const handleWordsPerGroupChange = (e: any) => {
      const index = e.detail.value
      selectedWordsPerGroupIndex.value = index
      const newValue = wordsPerGroupOptions[index].value
      currentSettings.value.wordsPerGroup = newValue
      LearnSettingsStorage.updateWordsPerGroup(newValue)

      // 显示保存成功提示
      uni.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 1500,
      })
    }

    // 保存目标到服务器
    const saveGoalsToServer = async () => {
      if (isSaving.value)
        return

      isSaving.value = true
      const newWordsGoal = currentSettings.value.dailyNewWordsGoal
      const reviewWordsGoal = currentSettings.value.dailyReviewWordsGoal

      const success = await LearnSettingsStorage.saveLearningGoalToServer(
        newWordsGoal,
        reviewWordsGoal,
      )

      if (success) {
        uni.showToast({
          title: '学习目标已保存',
          icon: 'success',
          duration: 1500,
        })
      }
      else {
        uni.showToast({
          title: '保存目标失败',
          icon: 'error',
          duration: 1500,
        })
      }

      isSaving.value = false
    }

    // 验证学习目标的函数
    const validateGoals = (newWordsGoal: number, reviewWordsGoal: number) => {
      if (newWordsGoal === 0 && reviewWordsGoal === 0) {
        uni.showToast({
          title: '每日新词和复习数量不能同时为零',
          icon: 'none',
          duration: 2000,
        })
        return false
      }
      return true
    }

    // 处理每日新词目标变更
    const handleNewWordsGoalChange = (e: any) => {
      const index = e.detail.value
      const newValue = dailyGoalOptions[index].value

      // 验证：新词目标设为0时，复习目标不能也为0
      if (!validateGoals(newValue, currentSettings.value.dailyReviewWordsGoal)) {
        return // 验证失败，不更新设置
      }

      selectedNewWordsGoalIndex.value = index
      currentSettings.value.dailyNewWordsGoal = newValue
      LearnSettingsStorage.updateDailyNewWordsGoal(newValue)
      saveGoalsToServer()
    }

    // 处理每日复习目标变更
    const handleReviewWordsGoalChange = (e: any) => {
      const index = e.detail.value
      const newValue = dailyGoalOptions[index].value

      // 验证：复习目标设为0时，新词目标不能也为0
      if (!validateGoals(currentSettings.value.dailyNewWordsGoal, newValue)) {
        return // 验证失败，不更新设置
      }

      selectedReviewWordsGoalIndex.value = index
      currentSettings.value.dailyReviewWordsGoal = newValue
      LearnSettingsStorage.updateDailyReviewWordsGoal(newValue)
      saveGoalsToServer()
    }

    // 从服务器获取学习目标
    const fetchLearningGoal = async () => {
      try {
        isLoading.value = true
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/clock-in/goal`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${uni.getStorageSync('token')}`,
          },
        })

        if (response.statusCode === 200 && response.data) {
          // 更新本地设置
          const goalData = response.data as LearningGoal
          currentSettings.value.dailyNewWordsGoal = goalData.dailyNewWordsGoal
          currentSettings.value.dailyReviewWordsGoal = goalData.dailyReviewWordsGoal

          // 更新选中的索引
          selectedNewWordsGoalIndex.value = dailyGoalOptions.findIndex(
            option => option.value === goalData.dailyNewWordsGoal,
          )
          if (selectedNewWordsGoalIndex.value < 0)
            selectedNewWordsGoalIndex.value = 1

          selectedReviewWordsGoalIndex.value = dailyGoalOptions.findIndex(
            option => option.value === goalData.dailyReviewWordsGoal,
          )
          if (selectedReviewWordsGoalIndex.value < 0)
            selectedReviewWordsGoalIndex.value = 2

          // 保存到本地存储
          LearnSettingsStorage.updateDailyNewWordsGoal(goalData.dailyNewWordsGoal)
          LearnSettingsStorage.updateDailyReviewWordsGoal(goalData.dailyReviewWordsGoal)

          return true
        }
        return false
      }
      catch (error) {
        console.error('获取学习目标失败:', error)
        return false
      }
      finally {
        isLoading.value = false
      }
    }

    // 加载设置
    const loadSettings = async () => {
      // 先加载本地设置
      currentSettings.value = LearnSettingsStorage.getSettings()
      selectedWordsPerGroupIndex.value = wordsPerGroupOptions.findIndex(
        option => option.value === currentSettings.value.wordsPerGroup,
      )

      // 加载每日目标设置
      selectedNewWordsGoalIndex.value = dailyGoalOptions.findIndex(
        option => option.value === currentSettings.value.dailyNewWordsGoal,
      )
      if (selectedNewWordsGoalIndex.value < 0)
        selectedNewWordsGoalIndex.value = 1

      selectedReviewWordsGoalIndex.value = dailyGoalOptions.findIndex(
        option => option.value === currentSettings.value.dailyReviewWordsGoal,
      )
      if (selectedReviewWordsGoalIndex.value < 0)
        selectedReviewWordsGoalIndex.value = 2

      // 从服务器获取最新设置
      await fetchLearningGoal()
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    onMounted(async () => {
      await loadSettings()
    })

    return {
      wordsPerGroupOptions,
      dailyGoalOptions,
      currentSettings,
      selectedWordsPerGroupIndex,
      selectedNewWordsGoalIndex,
      selectedReviewWordsGoalIndex,
      handleWordsPerGroupChange,
      handleNewWordsGoalChange,
      handleReviewWordsGoalChange,
      handleBack,
      isSaving,
      isLoading,
    }
  },
})
</script>

<template>
  <view class="container">
    <!-- 顶部返回按钮 -->
    <BackButton @back="handleBack" />

    <view class="py-16">
      <text class="block text-center text-2xl font-bold">
        学习设置
      </text>
    </view>

    <!-- 学习数量设置组 -->
    <view class="settings-group mb-6 rounded-lg p-4 frosted-glass">
      <view class="setting-row flex items-center justify-between border-b border-gray-200 py-3">
        <text class="setting-label text-lg">
          每组单词数量
        </text>
        <picker
          mode="selector"
          :range="wordsPerGroupOptions"
          range-key="text"
          :value="selectedWordsPerGroupIndex"
          class="ml-4 flex-1 text-right"
          @change="handleWordsPerGroupChange"
        >
          <view class="picker-value flex items-center justify-end">
            <text>{{ wordsPerGroupOptions[selectedWordsPerGroupIndex].text }}</text>
            <view class="i-mynaui:chevron-right ml-2" />
          </view>
        </picker>
      </view>

      <!-- 新增：每日学习目标设置 -->
      <view class="py-3 text-base text-gray-600">
        <text>每日学习目标</text>
        <text v-if="isLoading" class="ml-2 text-sm text-gray-400">
          (正在加载...)
        </text>
      </view>

      <view class="setting-row flex items-center justify-between border-b border-gray-200 py-3">
        <text class="setting-label text-lg">
          每日新词数量
        </text>
        <picker
          mode="selector"
          :range="dailyGoalOptions"
          range-key="text"
          :value="selectedNewWordsGoalIndex"
          class="ml-4 flex-1 text-right"
          @change="handleNewWordsGoalChange"
        >
          <view class="picker-value flex items-center justify-end">
            <text>{{ dailyGoalOptions[selectedNewWordsGoalIndex].text }}</text>
            <view class="i-mynaui:chevron-right ml-2" />
          </view>
        </picker>
      </view>

      <view class="setting-row flex items-center justify-between py-3">
        <text class="setting-label text-lg">
          每日复习数量
        </text>
        <picker
          mode="selector"
          :range="dailyGoalOptions"
          range-key="text"
          :value="selectedReviewWordsGoalIndex"
          class="ml-4 flex-1 text-right"
          @change="handleReviewWordsGoalChange"
        >
          <view class="picker-value flex items-center justify-end">
            <text>{{ dailyGoalOptions[selectedReviewWordsGoalIndex].text }}</text>
            <view class="i-mynaui:chevron-right ml-2" />
          </view>
        </picker>
      </view>
    </view>

    <view class="mt-8 text-center text-sm text-gray-500">
      <text>这些设置将自动保存并应用于下次学习</text>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 16px;
  box-sizing: border-box;
}

.settings-group {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.setting-row:last-child {
  border-bottom: none;
}
</style>

<route lang="json">
{
  "layout": "home"
}
</route>
