<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'CreateUserLexicon',
  components: {
    BackButton,
  },
  setup() {
    const languages = ref([
      { value: 'en', label: '英语', emoji: '🇺🇸' },
      { value: 'fr', label: '法语', emoji: '🇫🇷' },
      { value: 'de', label: '德语', emoji: '🇩🇪' },
    ])

    const bookName = ref('')
    const description = ref('')
    const selectedLanguage = ref(languages.value[0].value)
    const isPublic = ref(false)
    const tags = ref('')
    const isCreating = ref(false)
    const errorMessage = ref('')

    const handleBack = () => {
      uni.navigateBack()
    }

    const handleLanguageChange = (e: any) => {
      const index = e.detail.value
      selectedLanguage.value = languages.value[index].value
    }

    const createLexicon = async () => {
      if (!bookName.value.trim()) {
        uni.showToast({
          title: '请填写词书名称',
          icon: 'none',
        })
        return
      }

      if (!description.value.trim()) {
        uni.showToast({
          title: '请填写词书描述',
          icon: 'none',
        })
        return
      }

      try {
        isCreating.value = true
        errorMessage.value = ''

        const token = uni.getStorageSync('token')
        const userId = uni.getStorageSync('userInfo')?.userId

        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          uni.navigateTo({ url: '/pages/user/login' })
          return
        }

        // 处理标签
        const tagList = tags.value.trim() ? tags.value.split(',').map(tag => tag.trim()) : []

        // 构建请求数据
        const requestData = {
          bookName: bookName.value.trim(),
          description: description.value.trim(),
          language: selectedLanguage.value,
          isPublic: isPublic.value,
          tags: tagList,
          words: [], // 初始为空数组
        }

        // 使用新的API端点进行词书创建
        const response = await uni.request({
          url: `http://localhost:8082/api/v1/user-wordbooks/user/${userId}`,
          method: 'POST',
          data: requestData,
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        // 检查响应状态
        if (response.statusCode === 201 || response.statusCode === 200) {
          uni.showToast({
            title: '创建成功',
            icon: 'success',
          })

          // eslint-disable-next-line no-console
          console.log('词书创建成功:', response.data)

          // 创建成功后返回上一页
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
        else {
          errorMessage.value = `创建词书失败: ${response.statusCode}`
          console.error('创建词书失败:', response)
        }
      }
      catch (error) {
        errorMessage.value = '网络错误，请稍后再试'
        console.error('创建词书发生错误:', error)
      }
      finally {
        isCreating.value = false
      }
    }

    return {
      languages,
      bookName,
      description,
      selectedLanguage,
      isPublic,
      tags,
      isCreating,
      errorMessage,
      handleBack,
      handleLanguageChange,
      createLexicon,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />
  <!-- 顶部栏 -->
  <view class="fixed relative left-0 top-8 w-full flex items-center justify-center rounded-sm py-3 shadow-sm frosted-glass">
    <text class="text-xl font-bold">
      创建词书
    </text>
    <!-- 为了保持布局平衡，添加一个占位元素 -->
    <view class="absolute right-4 h-8 w-8" />
  </view>

  <!-- 表单区域 -->
  <view class="mt-16 flex-1 px-4 py-4">
    <!-- 错误信息 -->
    <view v-if="errorMessage" class="mb-6 rounded-lg bg-red-50 p-4 text-center text-red-500 shadow-sm">
      {{ errorMessage }}
    </view>

    <view class="rounded-xl bg-white/30 p-5 shadow-sm backdrop-blur-sm space-y-6">
      <!-- 词书名称 -->
      <view class="space-y-2">
        <text class="block text-sm text-gray-700 font-medium">
          词书名称
        </text>
        <input
          v-model="bookName"
          class="border border-gray-300 rounded-lg bg-white/70 px-4 py-3 shadow-sm transition-all focus:border-yellow focus:outline-none focus:ring-1 focus:ring-yellow"
          placeholder="请输入词书名称"
        >
      </view>

      <!-- 词书描述 -->
      <view class="space-y-2">
        <text class="block text-sm text-gray-700 font-medium">
          词书描述
        </text>
        <!-- 待解决的bug：这里使用w-full出问题了 -->
        <textarea
          v-model="description"
          class="h-28 w-86% border border-gray-300 rounded-lg bg-white/70 px-4 py-3 shadow-sm transition-all focus:border-yellow focus:outline-none focus:ring-1 focus:ring-yellow"
          placeholder="请输入词书描述"
        />
      </view>

      <!-- 语言选择 -->
      <view class="space-y-2">
        <text class="block text-sm text-gray-700 font-medium">
          选择语言
        </text>
        <picker
          mode="selector"
          :range="languages"
          range-key="label"
          class="w-full overflow-hidden border border-gray-300 rounded-lg bg-white/70 shadow-sm transition-all"
          @change="handleLanguageChange"
        >
          <view class="flex items-center px-4 py-3">
            <text class="mr-2 text-lg">
              {{ languages.find(l => l.value === selectedLanguage)?.emoji }}
            </text>
            <text class="flex-1">
              {{ languages.find(l => l.value === selectedLanguage)?.label }}
            </text>
            <view class="i-carbon:chevron-down text-gray-500" />
          </view>
        </picker>
      </view>

      <!-- 标签 -->
      <view class="space-y-2">
        <text class="block text-sm text-gray-700 font-medium">
          标签
        </text>
        <view class="relative">
          <input
            v-model="tags"
            class="border border-gray-300 rounded-lg bg-white/70 px-4 py-3 shadow-sm transition-all focus:border-yellow focus:outline-none focus:ring-1 focus:ring-yellow"
            placeholder="例如：基础,日常,学校"
          >
        </view>
      </view>

      <!-- 是否公开 -->
      <view class="flex items-center rounded-lg bg-white/50 p-3">
        <switch
          :checked="isPublic"
          color="#f59e0b"
          class="mr-3 scale-90"
          @change="e => isPublic = e.detail.value"
        />
        <view>
          <text class="block text-base text-gray-800">
            词书公开
          </text>
          <text class="text-xs text-gray-500">
            开启后其他用户可以查看和使用
          </text>
        </view>
      </view>
    </view>

    <!-- 创建按钮 -->
    <button
      class="mt-10 w-full rounded-lg bg-yellow py-4 text-white font-semibold shadow-md transition-all active:scale-98 active:shadow-sm"
      :class="{ 'opacity-70': isCreating }"
      :disabled="isCreating"
      @click="createLexicon"
    >
      {{ isCreating ? '创建中...' : '创建词书' }}
    </button>
  </view>
</template>

<style scoped>
/* 添加过渡效果 */
.transition-all {
  transition: all 0.2s ease;
}

/* 按钮按下缩小效果 */
.active\:scale-98:active {
  transform: scale(0.98);
}

/* 按钮按下阴影减小效果 */
.active\:shadow-sm:active {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 输入框焦点效果 */
input:focus, textarea:focus {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
