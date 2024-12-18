<script lang="ts">
import TabBar from '@/components/TabBar.vue' // 添加TabBar组件导入
// 添加API基础URL导入
import { WordAPI } from '@/types/Word'
import { type CurrentLexicon, LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent, onMounted, ref, watch } from 'vue'

// // 添加用户信息接口
// interface UserInfo {
//   userId: string // 改为 string 类型
//   username: string
//   email: string
//   phone: string | null
//   avatarUrl: string | null
//   status: number
//   createTime: string
//   updateTime: string
// }

export default defineComponent({
  name: 'Home',
  components: {
    TabBar,
  },
  setup() {
    const languages = ref([
      { name: 'unknown', icon: 'i-mynaui:question', displayName: '暂不选择', emoji: '❓' },
      { name: 'en', icon: 'i-circle-flags:us', displayName: '英语', emoji: '🇺🇸' },
      { name: 'fr', icon: 'i-circle-flags:fr', displayName: '法语', emoji: '🇫🇷' },
      { name: 'de', icon: 'i-circle-flags:de', displayName: '德语', emoji: '🇩🇪' },
    ])

    const selectedLanguage = ref(languages.value.find(
      lang => lang.name === uni.getStorageSync('selectedLanguage'),
    ) || languages.value[0])

    const showLanguageModal = ref(false)

    const username = ref<string>('')
    const avatarUrl = ref<string>('')
    const isBanned = ref(false)
    const defaultAvatar = '/static/avatar/avatar.png'

    const signInDays = ref<number>(0) // 累计签到天数
    const currentLexicon = ref<CurrentLexicon | null>(LexiconStorage.getCurrentLexicon()) // 当前词书

    watch(
      () => LexiconStorage.getCurrentLexicon(),
      (newValue) => {
        currentLexicon.value = newValue
      },
    )

    // const fetchUserInfo = async () => {
    //   try {
    //     // 首先检查token
    //     const token = uni.getStorageSync('token') // 使用统一的 token key
    //     if (!token) {
    //       uni.redirectTo({ url: '/pages/user/login' })
    //       return
    //     }

    //     // 获取用户信息
    //     const response = await uni.request({
    //       url: `${API_BASE_URL}/user/info`,
    //       method: 'GET',
    //       header: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     })

    //     if (response.statusCode === 200) {
    //       const userInfo = response.data as UserInfo // 使用类型断言

    //       // 保存用户信息到本地
    //       UserStorage.setCurrentUser(userInfo)

    //       // 设置页面数据
    //       username.value = userInfo.username
    //       avatarUrl.value = userInfo.avatarUrl || defaultAvatar
    //       isBanned.value = userInfo.status === 1

    //       if (isBanned.value) {
    //         uni.showToast({
    //           title: '账号已被封禁',
    //           icon: 'none',
    //           duration: 2000,
    //         })
    //       }
    //     }
    //     else if (response.statusCode === 401) {
    //       // token失效，清除本地存储并跳转登录
    //       uni.removeStorageSync('token')
    //       uni.removeStorageSync('userInfo')
    //       uni.redirectTo({ url: '/pages/user/login' })
    //     }
    //     else {
    //       throw new Error('获取用户信息失败')
    //     }
    //   }
    //   catch (error) {
    //     console.error('获取用户信息失败:', error)
    //     const localUser = UserStorage.getCurrentUser()
    //     if (localUser) {
    //       username.value = localUser.username
    //       avatarUrl.value = localUser.avatarUrl || defaultAvatar
    //       isBanned.value = localUser.status === 1
    //     }
    //     else {
    //       // 如果本地没有用户信息，跳转到登录页
    //       uni.redirectTo({
    //         url: '/pages/user/login',
    //       })
    //     }
    //   }
    // }

    const loadUserInfo = () => {
      try {
        const userInfo = uni.getStorageSync('userInfo')

        if (!userInfo) {
          uni.redirectTo({ url: '/pages/user/login' })
          return
        }

        // 直接使用存储的用户信息
        username.value = userInfo.username || ''
        avatarUrl.value = userInfo.avatarUrl || defaultAvatar
        isBanned.value = userInfo.status === 1
      }
      catch (error) {
        console.error('加载用户信息失败:', error)
        uni.redirectTo({ url: '/pages/user/login' })
      }
    }

    const selectInitialLanguage = () => {
      showLanguageModal.value = true
    }

    // 把词书检查函数移到这里，在使用之前
    const checkLexiconStatus = () => {
      // 只有在已选择语言后才提示选择词书
      if (selectedLanguage.value.name !== 'unknown') {
        const lexicon = LexiconStorage.getCurrentLexicon()
        currentLexicon.value = lexicon

        if (!lexicon) {
          uni.showModal({
            title: '提示',
            content: '您还未选择词书，是否前往选择？',
            success: (res) => {
              if (res.confirm)
                uni.navigateTo({ url: '/pages/user/selectlexicon' })
            },
          })
        }
      }
    }

    const handleSelectLanguage = (language: typeof languages.value[0]) => {
      selectedLanguage.value = language
      uni.setStorageSync('selectedLanguage', language.name)
      showLanguageModal.value = false

      // 清除当前词书
      LexiconStorage.clearCurrentLexicon()
      currentLexicon.value = null

      // 显示提示并强制跳转到词书选择界面
      uni.showModal({
        title: '语言已切换',
        content: '切换了语言系统，请前往选择词书',

        showCancel: false,
        success: () => {
          console.error('当前语言系统:', uni.getStorageSync('selectedLanguage'))
          uni.navigateTo({ url: '/pages/user/selectlexicon' })
        },
      })
    }

    const handleLanguageChange = (event: any) => {
      const index = event.detail.value
      selectedLanguage.value = languages.value[index]
      // 保存选择的语言到本地存储
      uni.setStorageSync('selectedLanguage', selectedLanguage.value.name)

      // 清除当前词书
      LexiconStorage.clearCurrentLexicon()
      currentLexicon.value = null

      // 显示提示并强制跳转到词书选择界面
      uni.showModal({
        title: '语言已切换',
        content: '切换了语言系统，请前往选择词书',
        showCancel: false,
        success: () => {
          console.error('当前语言系统:', uni.getStorageSync('selectedLanguage'))
          uni.navigateTo({ url: '/pages/user/selectlexicon' })
        },
      })
    }

    onMounted(() => {
      loadUserInfo()

      // 检查是否有选择语言
      const storedLanguage = uni.getStorageSync('selectedLanguage')
      if (!storedLanguage || storedLanguage === 'unknown') {
        uni.showModal({
          title: '欢迎来到 WordTrail 🎉',
          content: '首先请选择一个学习语言！',
          showCancel: false,
          success: () => {
            selectInitialLanguage()
          },
        })
      }
      else {
        checkLexiconStatus() // 只有在已有语言选择的情况下才检查词书
      }
    })

    const refreshData = () => {
      // 重新加载用户信息或其他需要刷新的数据
      loadUserInfo()
      checkLexiconStatus()
      // ...其他刷新逻辑...
    }

    onShow(() => {
      refreshData()
    })

    const navigateTo = (page: string) => {
      if (isBanned.value) {
        uni.showToast({
          title: '哎呦！被封禁啦！',
          icon: 'none',
        })
        return
      }
      uni.navigateTo({
        url: page,
      })
    }

    const handleLearnClick = async () => {
      if (isBanned.value) {
        uni.showToast({
          title: '哎呦！被封禁啦！',
          icon: 'none',
        })
        return
      }

      const lexicon = LexiconStorage.getCurrentLexicon()
      if (!lexicon) {
        uni.showToast({
          title: '请先选择词书',
          icon: 'none',
        })
        return
      }

      try {
        const words = await WordAPI.getLearnWords(lexicon.id)
        if (words && words.length > 0) {
          uni.navigateTo({
            url: `/pages/word/learn?words=${encodeURIComponent(JSON.stringify(words))}`,
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

    const handleReviewClick = async () => {
      if (isBanned.value) {
        uni.showToast({
          title: '哎呦！被封禁啦！',
          icon: 'none',
        })
        return
      }

      const lexicon = LexiconStorage.getCurrentLexicon()
      if (!lexicon) {
        uni.showToast({
          title: '请先选择词书',
          icon: 'none',
        })
        return
      }

      try {
        const words = await WordAPI.getReviewWords(lexicon.id)
        if (words && words.length > 0) {
          uni.navigateTo({
            url: `/pages/word/review?words=${encodeURIComponent(JSON.stringify(words))}`,
          })
        }
        else {
          uni.showToast({
            title: '没有需要复习的单词',
            icon: 'none',
          })
        }
      }
      catch (error) {
        console.error('获取复习单词失败:', error)
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
      avatarUrl,
      isBanned,
      handleLanguageChange,
      showLanguageModal,
      handleSelectLanguage,
      navigateTo,
      signInDays,
      handleLearnClick,
      handleReviewClick,
      currentLexicon,
    }
  },
})
</script>

<template>
  <!-- Header -->
  <view class="mb-4 w-full flex items-center justify-between">
    <view class="flex items-center">
      <image
        :src="avatarUrl"
        class="h-16 w-16 rounded-full"
        @error="avatarUrl = '/static/avatar/avatar.png'"
      />
      <text class="ml-2 text-lg">
        {{ username }}
      </text>
    </view>
    <view class="flex items-center">
      <view class="i-mynaui:cog-two cursor-pointer text-2xl" aria-label="设置" @click="navigateTo('/pages/user/settings')" />
    </view>
  </view>

  <!-- 被封禁提示 -->
  <view v-if="isBanned" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <view class="rounded-lg bg-white p-6 text-center">
      <text class="text-xl text-red-500 font-bold">
        哎呦！被封禁啦！
      </text>
      <text class="mt-2 text-gray-600">
        您的账号已被封禁，请联系管理员解封。
      </text>
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
  </view>

  <!-- Language Selection Modal -->
  <view v-if="showLanguageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <view class="w-4/5 rounded-lg bg-white p-6">
      <text class="mb-4 block text-center text-xl font-bold">
        选择学习语言
      </text>
      <view class="space-y-3">
        <view
          v-for="lang in languages.slice(1)"
          :key="lang.name"
          class="flex cursor-pointer items-center rounded-lg p-3 transition-colors"
          :class="selectedLanguage.name === lang.name ? 'bg-yellow text-white' : 'bg-gray-100'"
          @click="handleSelectLanguage(lang)"
        >
          <text class="mr-2 text-lg">
            {{ lang.emoji }}
          </text>
          <text>{{ lang.displayName }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- Calendar -->  <!-- 签到日历 -->  <Calendar v-model:sign-in-days="signInDays" class="mb-4" />  <!-- Current Lexicon -->  <view class="mb-4">
    <text class="text-lg">
      当前词书：{{ currentLexicon?.name || '未选择' }}
    </text>
  </view>  <!-- Learn and Review Buttons -->  <view class="fixed bottom-20 left-5 right-5 flex justify-around">
    <button class="mr-6 w-sm frosted-glass" @click="handleLearnClick">
      Learn
    </button>
    <button class="w-sm frosted-glass" @click="handleReviewClick">
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
