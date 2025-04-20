<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { generateStory } from '@/services/openai'
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  components: {
    BackButton,
  },
  setup() {
    const story = ref('')
    const translation = ref('')
    const isLoading = ref(true)
    const errorMessage = ref('')

    const handleBack = () => {
      uni.redirectTo({
        url: '/pages/home/home',
      })
    }

    onMounted(async () => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const options = (currentPage as any).options

      const language = decodeURIComponent(options.language || 'English')
      const words = JSON.parse(decodeURIComponent(options.words || '[]'))

      try {
        const result = await generateStory(language, words)
        story.value = result.story
        translation.value = result.translation
      }
      catch (error) {
        console.error('生成 AI 故事失败:', error)
        errorMessage.value = '生成 AI 故事失败，请稍后重试。'
      }
      finally {
        isLoading.value = false
      }
    })

    return {
      story,
      translation,
      isLoading,
      errorMessage,
      handleBack,
    }
  },
})
</script>

<template>
  <view class="h-full flex flex-col">
    <!-- Header 区域 -->
    <view class="header bg-white p-4 shadow-md">
      <BackButton @back="handleBack" />
    </view>

    <!-- Content 区域 -->
    <view class="content flex-1 bg-light/50 p-6">
      <!-- 加载状态 -->
      <view v-if="isLoading" class="p-4 text-center">
        正在生成 AI 总结...
      </view>

      <!-- 错误提示 -->
      <view v-if="errorMessage" class="p-4 text-center text-red-500">
        {{ errorMessage }}
      </view>

      <!-- 显示 AI 故事和翻译 -->
      <view v-else>
        <text class="mb-4 block text-lg text-dark font-bold">
          AI 故事:
        </text>
        <text class="mb-6 block text-base text-dark">
          {{ story }}
        </text>

        <text class="mb-4 block text-lg text-dark font-bold">
          翻译:
        </text>
        <text class="block text-base text-gray-700">
          {{ translation }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.text-dark {
  color: #333; /* 深色字体 */
}

.text-center {
  text-align: center;
}

.header {
  background-color: transparent;
  box-shadow: none;
}

.content {
  flex: 1;
  margin-top: 1rem; /* 确保内容与 header 分离 */
  background-color: rgba(255, 255, 255, 0.4); /* 半透明背景 */
}
</style>

<route lang="json">
{
  "navigationBarTitleText": "AI 总结",
  "navigationStyle": "default"
}
</route>
