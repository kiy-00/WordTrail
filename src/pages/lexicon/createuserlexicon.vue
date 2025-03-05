<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { API_BASE_URL } from '@/config/api'
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

        if (!token || !userId) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          uni.navigateTo({ url: '/pages/user/login' })
          return
        }

        // 处理标签
        const tagList = tags.value.trim() ? tags.value.split(',').map(tag => tag.trim()) : []

        // 发送创建词书请求
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/user-wordbooks`,
          method: 'POST',
          data: {
            bookName: bookName.value.trim(),
            description: description.value.trim(),
            language: selectedLanguage.value,
            isPublic: isPublic.value,
            tags: tagList,
            createUser: userId,
          },
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 201 || response.statusCode === 200) {
          uni.showToast({
            title: '创建成功',
            icon: 'success',
          })

          // 创建成功后返回上一页
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
        else {
          errorMessage.value = '创建词书失败'
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
  <view class="h-full flex flex-col">
    <!-- 顶部栏 -->
    <view class="fixed top-0 z-10 w-full flex items-center justify-between bg-white px-4 py-3 shadow-sm">
      <BackButton @back="handleBack" />
      <text class="text-xl font-bold">
        创建词书
      </text>
      <view class="h-8 w-8">
        <!-- 占位 -->
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="mt-16 flex-1 px-4 py-4">
      <!-- 错误信息 -->
      <view v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 p-3 text-center text-red-500">
        {{ errorMessage }}
      </view>

      <view class="space-y-4">
        <!-- 词书名称 -->
        <view class="space-y-1">
          <text class="text-sm text-gray-600">
            词书名称
          </text>
          <input
            v-model="bookName"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="请输入词书名称"
          >
        </view>

        <!-- 词书描述 -->
        <view class="space-y-1">
          <text class="text-sm text-gray-600">
            词书描述
          </text>
          <textarea
            v-model="description"
            class="h-24 w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="请输入词书描述"
          />
        </view>

        <!-- 语言选择 -->
        <view class="space-y-1">
          <text class="text-sm text-gray-600">
            选择语言
          </text>
          <picker
            mode="selector"
            :range="languages"
            range-key="label"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            @change="handleLanguageChange"
          >
            <view class="flex items-center">
              <text class="mr-2">
                {{ languages.find(l => l.value === selectedLanguage)?.emoji }}
              </text>
              <text>
                {{ languages.find(l => l.value === selectedLanguage)?.label }}
              </text>
            </view>
          </picker>
        </view>

        <!-- 标签 -->
        <view class="space-y-1">
          <text class="text-sm text-gray-600">
            标签（多个标签请用逗号分隔）
          </text>
          <input
            v-model="tags"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="例如：基础,日常,学校"
          >
        </view>

        <!-- 是否公开 -->
        <view class="flex items-center space-x-2">
          <switch
            :checked="isPublic"
            color="#f59e0b"
            @change="e => isPublic = e.detail.value"
          />
          <text class="text-sm text-gray-600">
            词书公开（其他用户可以查看和使用）
          </text>
        </view>

        <!-- 创建按钮 -->
        <button
          class="mt-6 w-full rounded-lg bg-yellow py-3 text-white"
          :disabled="isCreating"
          @click="createLexicon"
        >
          {{ isCreating ? '创建中...' : '创建词书' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 可以根据需要添加样式 */
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
