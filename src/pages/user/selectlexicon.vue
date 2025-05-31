<script lang="ts">
import type { LexiconStatus } from '@/components/LexiconBox.vue'
import type { Lexicon, SystemWordbook, WordbooksResponse } from '@/types/Lexicon'
import { LanguageStorage } from '@/utils/languageStorage'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent, onMounted, ref } from 'vue'

interface UserWordbook {
  id: string
  bookName: string
  description: string
  language: string
  createUser: string
  createTime: string
  isPublic: boolean
  status: string
  tags: string[] | null
  words?: string[] | null // 添加words属性，设为可选
}

export default defineComponent({
  name: 'SelectLexicon',

  setup() {
    const activeTab = ref<'all' | LexiconStatus>('all')
    const allLexicons = ref<Lexicon[]>([])
    const displayedLexicons = ref<Lexicon[]>([])
    const isRefreshing = ref(false)
    const lexiconsPerLoad = 20
    const currentLoad = ref(1)
    const searchQuery = ref('')
    const isSearchVisible = ref(false)
    const selectedLanguage = ref(LanguageStorage.getCurrentLanguage())
    const currentPage = ref(0)
    const pageSize = ref(10)
    const totalPages = ref(1)
    const isLastPage = ref(false)
    const activeType = ref<'system' | 'user' | 'my'>('system')
    const userLexicons = ref<UserWordbook[]>([])
    const myWordbooks = ref<UserWordbook[]>([])
    const userId = ref<string>('')

    const languages = [
      {
        name: 'unknown',
        icon: 'i-circle-flags:question',
        displayName: '未知',
        emoji: '❓',
        successMessage: 'Unknown selected!',
      },
      {
        name: 'en',
        icon: 'i-circle-flags:us',
        displayName: '英语',
        emoji: '🇺🇸',
        successMessage: 'English selected!',
      },
      {
        name: 'fr',
        icon: 'i-circle-flags:fr',
        displayName: '法语',
        emoji: '🇫🇷',
        successMessage: 'Français sélectionné!',
      },
      {
        name: 'de',
        icon: 'i-circle-flags:de',
        displayName: '德语',
        emoji: '🇩🇪',
        successMessage: 'Deutsch ausgewählt!',
      },
    ]

    const currentLanguage = ref(languages.find(
      lang => lang.name === uni.getStorageSync('selectedLanguage'),
    ) || languages[0])

    const debugInfo = ref({
      allBooks: [] as Lexicon[],
      currentLanguage: '',
      error: '',
    })

    const filterLexicons = () => {
      const filteredLexicons = allLexicons.value.filter((lexicon) => {
        const matchesSearch = lexicon.bookName.toLowerCase().includes(searchQuery.value.toLowerCase())
        return matchesSearch
      })
      displayedLexicons.value = filteredLexicons.slice(0, currentLoad.value * lexiconsPerLoad)
    }

    const fetchLexicons = async () => {
      try {
        const token = uni.getStorageSync('token')
        // eslint-disable-next-line no-console
        console.log('Token:', token)
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000,
          })
          uni.redirectTo({ url: '/pages/user/login' })
          return
        }

        if (!userId.value) {
          try {
            const userInfo = uni.getStorageSync('userInfo')
            // eslint-disable-next-line no-console
            console.log('Raw userInfo:', userInfo)

            // 直接从userInfo对象中获取userId
            if (userInfo && userInfo.userId) {
              userId.value = userInfo.userId
            }
            else if (userInfo && userInfo.id) {
              userId.value = userInfo.id
            }

            // 如果仍未获取到userId，尝试获取默认值
            if (!userId.value) {
              userId.value = '' // 使用默认ID
            }

            // eslint-disable-next-line no-console
            console.log('Resolved User ID:', userId.value)
          }
          catch (e) {
            console.error('Failed to get user info:', e)
            userId.value = '' // 出错时使用默认ID
          }
        }

        if (activeType.value === 'system') {
          const response = await uni.request({
            url: `/api/v1/system-wordbooks/by-language/${selectedLanguage.value.name}`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          if (response.statusCode === 200) {
            const data = response.data as SystemWordbook[]
            // eslint-disable-next-line no-console
            console.log('System wordbooks:', data)
            const lexicons: Lexicon[] = data.map(book => ({
              id: book.id,
              bookName: book.bookName,
              description: book.description,
              language: book.language,
              wordCount: 0,
              createUser: book.createUser,
              words: [],
            }))
            allLexicons.value = [...allLexicons.value, ...lexicons]
            filterLexicons()
          }
          else {
            throw new Error('Failed to fetch system wordbooks')
          }
        }
        else if (activeType.value === 'user') {
          const response = await uni.request({
            url: `/api/v1/user-wordbooks/by-language/${selectedLanguage.value.name}/approved`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          if (response.statusCode === 200 && Array.isArray(response.data)) {
            userLexicons.value = response.data as UserWordbook[]
            allLexicons.value = userLexicons.value.map(book => ({
              id: book.id,
              bookName: book.bookName,
              description: book.description,
              language: book.language,
              wordCount: 0,
              createUser: book.createUser,
              words: [],
            }))
            filterLexicons()
          }
          else {
            throw new Error('Failed to fetch approved public wordbooks')
          }
        }
        else if (activeType.value === 'my') {
          if (!userId.value) {
            throw new Error('无法获取用户ID，请重新登录')
          }

          const response = await uni.request({
            url: `/api/v1/user-wordbooks/user/${userId.value}`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.statusCode === 200 && response.data) {
            const data = response.data as { content: UserWordbook[] }
            myWordbooks.value = data.content || []
            const filteredBooks = myWordbooks.value.filter(
              book => book.language === selectedLanguage.value.name,
            )
            userLexicons.value = filteredBooks
            allLexicons.value = filteredBooks.map(book => ({
              id: book.id,
              bookName: book.bookName,
              description: book.description,
              language: book.language,
              wordCount: book.words?.length || 0,
              createUser: book.createUser,
              words: [],
            }))
            filterLexicons()
          }
          else {
            throw new Error('获取我的词书失败')
          }
        }
        else {
          const response = await uni.request({
            url: `/api/v1/system-wordbooks`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            data: {
              page: currentPage.value,
              size: pageSize.value,
              ...(selectedLanguage.value.name !== 'unknown' && {
                language: selectedLanguage.value.name,
              }),
            },
          })

          if (response.statusCode === 200) {
            const data = response.data as WordbooksResponse

            const lexicons: Lexicon[] = data.content.map((book: SystemWordbook) => ({
              id: book.id,
              bookName: book.bookName,
              description: book.description,
              language: book.language,
              wordCount: book.words.length,
              createUser: book.createUser,
              words: book.words,
            }))

            if (currentPage.value === 0)
              allLexicons.value = lexicons
            else
              allLexicons.value = [...allLexicons.value, ...lexicons]

            totalPages.value = data.totalPages
            isLastPage.value = data.last
            filterLexicons()
          }
          else if (response.statusCode === 401 || response.statusCode === 403) {
            uni.showToast({
              title: '请重新登录',
              icon: 'none',
              duration: 2000,
            })
            uni.redirectTo({ url: '/pages/user/login' })
          }
          else {
            throw new Error('Failed to fetch lexicons')
          }
        }
      }
      catch (error) {
        debugInfo.value.error = error instanceof Error ? error.message : '获取词书列表失败'
        uni.showToast({
          title: debugInfo.value.error,
          icon: 'none',
          duration: 2000,
        })
      }
    }

    const switchLexicon = async (lexicon: Lexicon) => {
      uni.showModal({
        title: '📚 确认选择',
        content: `确定要选择「${lexicon.bookName}」作为您的词书吗？`,
        success: (res) => {
          if (res.confirm) {
            try {
              LexiconStorage.setCurrentLexicon({
                id: lexicon.id,
                name: lexicon.bookName,
              })

              const savedLexicon = LexiconStorage.getCurrentLexicon()
              if (savedLexicon && savedLexicon.id === lexicon.id) {
                uni.showToast({
                  title: '🎉 选择成功！',
                  icon: 'success',
                  duration: 1500,
                  success: () => {
                    setTimeout(() => {
                      uni.navigateBack()
                    }, 1500)
                  },
                })
              }
              else {
                throw new Error('词书保存验证失败')
              }
            }
            catch {
              uni.showToast({
                title: '保存失败，请重试',
                icon: 'none',
              })
            }
          }
        },
      })
    }

    const handleSwitchLexicon = async (lexicon: Lexicon) => {
      switchLexicon(lexicon)
    }

    const initializeLexicons = async () => {
      await fetchLexicons()
      filterLexicons()
    }

    const handleSearch = (event: UniHelper.InputOnInputEvent) => {
      searchQuery.value = event.detail.value
      currentLoad.value = 1
      filterLexicons()
    }

    const toggleSearch = () => {
      isSearchVisible.value = !isSearchVisible.value
      if (!isSearchVisible.value)
        searchQuery.value = ''
    }

    const onSearch = () => {
      if (searchQuery.value.trim()) {
        filterLexicons()
      }
    }

    const handleLanguageChange = (newLanguage: any) => {
      selectedLanguage.value = newLanguage
      fetchLexicons()
    }

    const onRefresh = async () => {
      isRefreshing.value = true
      currentPage.value = 0
      allLexicons.value = []
      await fetchLexicons()
      isRefreshing.value = false
    }

    const onLoadMore = async () => {
      if (!isLastPage.value) {
        currentPage.value++
        await fetchLexicons()
      }
    }

    const handleTypeChange = (type: 'system' | 'user' | 'my') => {
      activeType.value = type
      currentPage.value = 0
      allLexicons.value = []
      fetchLexicons()
    }

    onMounted(() => {
      const storedLanguage = uni.getStorageSync('selectedLanguage')
      const foundLanguage = languages.find(lang => lang.name === storedLanguage)
      if (foundLanguage) {
        selectedLanguage.value = foundLanguage
        currentLanguage.value = foundLanguage
      }

      initializeLexicons()
    })

    const handleBack = () => {
      uni.navigateBack()
    }

    return {
      activeTab,
      displayedLexicons,
      isRefreshing,
      handleSearch,
      handleSwitchLexicon,
      onRefresh,
      onLoadMore,
      isSearchVisible,
      toggleSearch,
      onSearch,
      searchQuery,
      handleBack,
      currentLanguage,
      debugInfo,
      selectedLanguage,
      handleLanguageChange,
      isLastPage,
      totalPages,
      currentPage,
      activeType,
      handleTypeChange,
      userLexicons,
      myWordbooks,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <view class="mt-8 rounded p-4 shadow-sm frosted-glass">
    <view class="mb-4 flex items-center justify-between">
      <text class="text-xl font-bold">
        词库
      </text>
      <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="toggleSearch">
        <view class="i-mynaui:search text-2xl" />
      </view>
    </view>
  </view>

  <transition book-name="fade">
    <view v-if="isSearchVisible" class="animate-fadeIn fixed left-0 right-0 top-16 z-50 px-4 py-2 shadow-md frosted-glass">
      <view class="flex items-center">
        <view class="i-mynaui:search mr-2 text-xl text-gray-400" />
        <input
          :value="searchQuery"
          type="text"
          placeholder="搜索词书..."
          class="flex-1 bg-transparent text-base outline-none"
          @input="handleSearch"
          @keydown.enter="onSearch"
        >
        <view class="i-ci:close-md ml-2 cursor-pointer text-xl" @click="toggleSearch" />
      </view>
    </view>
  </transition>

  <view class="fixed bottom-4 right-4 z-50 flex items-center rounded-lg bg-yellow px-4 py-2">
    <view :class="currentLanguage.icon" class="mr-2 text-lg" />
    <text class="text-white">
      {{ currentLanguage.displayName }}
    </text>
  </view>

  <view class="mt-5 flex border-b rounded-md frosted-glass">
    <view
      class="flex-1 py-3 text-center"
      :class="{ 'border-b-2 border-yellow text-yellow': activeType === 'system' }"
      @click="handleTypeChange('system')"
    >
      系统词书
    </view>
    <view
      class="flex-1 py-3 text-center"
      :class="{ 'border-b-2 border-yellow text-yellow': activeType === 'user' }"
      @click="handleTypeChange('user')"
    >
      公开词书
    </view>
    <view
      class="flex-1 py-3 text-center"
      :class="{ 'border-b-2 border-yellow text-yellow': activeType === 'my' }"
      @click="handleTypeChange('my')"
    >
      我的词书
    </view>
  </view>

  <scroll-view
    :scroll-y="true"
    refresher-enabled
    :refresher-triggered="isRefreshing"
    class="flex-1"
    :lower-threshold="50"
    @refresherrefresh="onRefresh"
    @scrolltolower="onLoadMore"
  >
    <view class="p-4">
      <template v-if="activeType === 'system' && displayedLexicons.length">
        <LexiconBox
          v-for="lexicon in displayedLexicons"
          :id="lexicon.id"
          :key="lexicon.id"
          :name="lexicon.bookName"
          :description="lexicon.description"
          :word-count="lexicon.wordCount"
          @click="handleSwitchLexicon(lexicon)"
        />
      </template>
      <template v-else-if="(activeType === 'user' || activeType === 'my') && userLexicons.length">
        <UserLexiconBox
          v-for="lexicon in userLexicons"
          :id="lexicon.id"
          :key="lexicon.id"
          :name="lexicon.bookName"
          :description="lexicon.description"
          :create-time="lexicon.createTime"
          :is-public="lexicon.isPublic"
          :status="lexicon.status"
          :tags="lexicon.tags || []"
          :create-user="lexicon.createUser"
          @click="handleSwitchLexicon({
            id: lexicon.id,
            bookName: lexicon.bookName,
            description: lexicon.description,
            language: lexicon.language,
            wordCount: lexicon.words?.length || 0,
            createUser: lexicon.createUser,
            words: [],
          })"
        />
      </template>
      <view v-else class="py-4 text-center text-gray-500">
        暂无词书数据
      </view>
    </view>
  </scroll-view>
</template>

<route lang="json">
{  "layout": "default"}
</route>

<style scoped>
</style>
