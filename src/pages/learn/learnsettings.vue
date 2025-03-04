<script lang="ts">
import type { LearnSettings } from '@/utils/learnSettingsStorage'
import { LearnSettingsStorage } from '@/utils/learnSettingsStorage'
import { defineComponent, onMounted, ref } from 'vue'

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

    // 当前设置
    const currentSettings = ref<LearnSettings>(LearnSettingsStorage.getSettings())

    // 选中的单词数量索引
    const selectedWordsPerGroupIndex = ref(
      wordsPerGroupOptions.findIndex(option => option.value === currentSettings.value.wordsPerGroup),
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

    // 处理拼写加强设置变更
    const handleSpellingChange = (e: any) => {
      const enable = e.detail.value
      currentSettings.value.enableSpelling = enable
      LearnSettingsStorage.updateEnableSpelling(enable)

      // 显示保存成功提示
      uni.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 1500,
      })
    }

    // 加载设置
    const loadSettings = () => {
      currentSettings.value = LearnSettingsStorage.getSettings()
      selectedWordsPerGroupIndex.value = wordsPerGroupOptions.findIndex(
        option => option.value === currentSettings.value.wordsPerGroup,
      )
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    onMounted(() => {
      loadSettings()
    })

    return {
      wordsPerGroupOptions,
      currentSettings,
      selectedWordsPerGroupIndex,
      handleWordsPerGroupChange,
      handleSpellingChange,
      handleBack,
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

      <view class="setting-row flex items-center justify-between py-3">
        <view>
          <text class="setting-label text-lg">
            开启单词拼写加强记忆
          </text>
          <text class="mt-1 block text-sm text-gray-500">
            学习时，需要输入单词完整拼写
          </text>
        </view>
        <switch
          :checked="currentSettings.enableSpelling"
          color="#e6b11e"
          @change="handleSpellingChange"
        />
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
