<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'Home',

  setup() {
    const selectedLanguage = ref<string>('English')
    const languages = ref<string[]>(['English', 'Spanish', 'French', 'German', 'Chinese'])
    const username = ref<string>('Anna') // 添加用户名

    const handleLanguageChange = (event: any) => {
      selectedLanguage.value = languages.value[event.detail.value]
    }

    const navigateTo = (page: string) => {
      uni.navigateTo({
        url: page,
      })
    }

    return {
      selectedLanguage,
      languages,
      username,
      handleLanguageChange,
      navigateTo,
    }
  },
})
</script>

<template>
  <!-- Header -->
  <view class="mb-4 w-full flex items-center justify-between">
    <view class="flex items-center">
      <image class="h-16 w-16 rounded-full" src="@/static/avatar/avatar.png" alt="User Avatar" />
      <text class="ml-2 text-lg">
        {{ username }}
      </text>
    </view>
    <view class="flex items-center">
      <view class="i-mynaui:cog-two cursor-pointer text-2xl" aria-label="设置" @click="navigateTo('/pages/user/settings')" />
    </view>
  </view>

  <!-- Language Selector -->
  <view class="mb-4 w-full">
    <picker mode="selector" :range="languages" @change="handleLanguageChange">
      <view class="border border-gray-300 rounded-lg p-2">
        {{ selectedLanguage }}
      </view>
    </picker>
  </view>

  <view class="footer mt-auto">
    <view class="buttons flex flex-row">
      <button class="mr-6 w-sm frosted-glass" @click="navigateTo('/pages/word/learn')">
        Learn
      </button>
      <button class="w-sm frosted-glass">
        Review
      </button>
    </view>
    <TabBar />
  </view>
</template>

<style scoped>
</style>

<route lang="json">
{
  "layout": "home"
}
</route>
