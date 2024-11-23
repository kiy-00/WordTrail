<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'Home',

  setup() {
    const languages = ref<{ name: string, icon: string }[]>([
      { name: 'English', icon: 'i-circle-flags:us' },
      { name: 'Spanish', icon: 'i-circle-flags:es' },
      { name: 'French', icon: 'i-circle-flags:fr' },
      { name: 'German', icon: 'i-circle-flags:de' },
      { name: 'Chinese', icon: 'i-circle-flags:cn' },
    ])
    const selectedLanguage = ref<string>('English') // 当前选中的语言
    const username = ref<string>('Anna') // 添加用户名

    const signInDays = ref<number>(0) // 累计签到天数

    const handleLanguageChange = (event: any) => {
      const index = event.detail.value
      selectedLanguage.value = languages.value[index].name
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
      signInDays,
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
  <view class="mb-4 w-1/2 flex items-center rounded-lg px-4 py-2 frosted-glass">
    <view :class="languages.find(lang => lang.name === selectedLanguage)?.icon" class="text-lg" />
    <picker mode="selector" :range="languages.map(lang => lang.name)" class="ml-2 flex-1" @change="handleLanguageChange">
      <text>
        {{ selectedLanguage }}
      </text>
    </picker>
    <view class="i-mynaui:chevron-down ml-2" />
  </view>

  <!-- Calendar -->
  <!-- 签到日历 -->
  <Calendar v-model:sign-in-days="signInDays" class="mb-4" />

  <!-- Learn and Review Buttons -->

  <view class="fixed bottom-20 left-5 right-5 flex justify-around">
    <button class="mr-6 w-sm frosted-glass" @click="navigateTo('/pages/word/learn')">
      Learn
    </button>
    <button class="w-sm frosted-glass" @click="navigateTo('/pages/word/review')">
      Review
    </button>
  </view>

  <TabBar />
</template>

<style scoped>

</style>

<route lang="json">
{
  "layout": "home"
}
</route>
