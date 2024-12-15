<script lang="ts">
import { WordAPI } from '@/types/Word'
import { LanguageStorage, SUPPORTED_LANGUAGES } from '@/utils/languageStorage'
import { type CurrentLexicon, LexiconStorage } from '@/utils/lexiconStorage'
import { UserStorage } from '@/utils/userStorage'
import { defineComponent, onMounted, ref, watch } from 'vue'

export default defineComponent({
  name: 'Home',

  setup() {
    const languages = ref(SUPPORTED_LANGUAGES)
    const selectedLanguage = ref(LanguageStorage.getCurrentLanguage())
    const username = ref<string>('')

    const signInDays = ref<number>(0) // 累计签到天数
    const currentLexicon = ref<CurrentLexicon | null>(LexiconStorage.getCurrentLexicon()) // 当前词书

    onMounted(() => {
      // 获取用户信息
      const userInfo = UserStorage.getCurrentUser()
      if (userInfo) {
        username.value = userInfo.username
      }
      else {
        // 如果本地没有用户信息，设置默认值
        username.value = '未登录用户'
        // TODO: 后续添加实际的用户信息获取逻辑
      }

      // 检查词书选择状态
      if (!currentLexicon.value) {
        uni.showModal({
          title: '提示',
          content: '您还未选择词书，是否前往选择？',
          success: (res) => {
            if (res.confirm)
              uni.navigateTo({ url: '/pages/user/selectlexicon' })
          },
        })
      }
    })

    const handleLanguageChange = (event: any) => {
      const index = event.detail.value
      const newLanguage = languages.value[index]
      LanguageStorage.setCurrentLanguage(newLanguage.name)
      selectedLanguage.value = newLanguage

      // 显示切换成功提示
      uni.showToast({
        title: `${newLanguage.emoji} ${newLanguage.successMessage}`,
        icon: 'none',
        duration: 2000,
      })
    }

    const navigateTo = (page: string) => {
      uni.navigateTo({
        url: page,
      })
    }

    const handleLearnClick = async () => {
      const lexicon = LexiconStorage.getCurrentLexicon()
      if (!lexicon) {
        uni.showToast({
          title: '请先选择词书',
          icon: 'none',
        })
        return
      }

      try {
        const words = await WordAPI.getLearnWords(lexicon.id) // 使用词书 id 获取单词
        if (words && words.length > 0) {
          uni.navigateTo({
            url: '/pages/word/learn',
            success: (res) => {
              res.eventChannel.emit('acceptWords', { words })
            },
          })
        }
        else {
          uni.showToast({
            title: '没有需要学习的单词',
            icon: 'none',
          })
        }
      }
      catch (error) {
        console.error('获取学习单词失败:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
        })
      }
    }

    // 添加监听词书变化的函数
    watch(() => LexiconStorage.getCurrentLexicon(), (newValue) => {
      currentLexicon.value = newValue
    })

    return {
      selectedLanguage,
      languages,
      username,
      handleLanguageChange,
      navigateTo,
      signInDays,
      handleLearnClick,
      currentLexicon,
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
    <view :class="selectedLanguage.icon" class="text-lg" />
    <picker
      mode="selector"
      :range="languages"
      range-key="displayName"
      class="ml-2 flex-1"
      @change="handleLanguageChange"
    >
      <text>{{ selectedLanguage.displayName }}</text>
    </picker>
    <view class="i-mynaui:chevron-down ml-2" />
  </view>  <!-- Calendar -->  <!-- 签到日历 -->  <Calendar v-model:sign-in-days="signInDays" class="mb-4" />  <!-- Current Lexicon -->  <view class="mb-4">
    <text class="text-lg">
      当前词书：{{ currentLexicon?.name || '未选择' }}
    </text>
  </view>  <!-- Learn and Review Buttons -->  <view class="fixed bottom-20 left-5 right-5 flex justify-around">
    <button class="mr-6 w-sm frosted-glass" @click="handleLearnClick">
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
