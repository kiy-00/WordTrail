<script lang="ts">
import type { LexiconStatus } from '@/components/LexiconBox.vue'
import type { Lexicon, SystemWordbook, WordbooksResponse } from '@/types/Lexicon'
import { API_BASE_URL } from '@/config/api'
import { LexiconAPI } from '@/types/Lexicon'
import { LanguageStorage } from '@/utils/languageStorage'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent, onMounted, ref } from 'vue' // 删除未使用的 watch

export default defineComponent({
  name: 'SelectLexicon',

  setup() {
    const activeTab = ref<'all' | LexiconStatus>('all') // 注释而不是删除
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

    // 添加语言显示相关代码
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

    // 添加调试信息
    const debugInfo = ref({
      allBooks: [] as Lexicon[],
      currentLanguage: '',
      error: '',
    })

    // 根据当前标签筛选词书
    const filterLexicons = () => {
      const filteredLexicons = allLexicons.value.filter((lexicon) => {
        // const matchesTab = activeTab.value === 'all' || lexicon.status === activeTab.value
        const matchesSearch = lexicon.bookName.toLowerCase().includes(searchQuery.value.toLowerCase())
        return /* matchesTab && */ matchesSearch
      })
      displayedLexicons.value = filteredLexicons.slice(0, currentLoad.value * lexiconsPerLoad)
    }

    // 获取词书数据
    const fetchLexicons = async () => {
      try {
        // 获取存储的 token
        const token = uni.getStorageSync('token')
        console.error('Token:', token)
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000,
          })
          uni.redirectTo({ url: '/pages/user/login' })
          return
        }

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/system-wordbooks`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`, // 添加 token 到请求头
            'Content-Type': 'application/json',
          },
          data: {
            page: currentPage.value,
            size: pageSize.value,
            // Add any filters if needed
            ...(selectedLanguage.value.name !== 'unknown' && {
              language: selectedLanguage.value.name,
            }),
          },
        })

        if (response.statusCode === 200) {
          const data = response.data as WordbooksResponse

          // Convert system wordbooks to lexicons
          const lexicons: Lexicon[] = data.content.map((book: SystemWordbook) => ({
            id: book.id,
            bookName: book.bookName,
            description: book.description,
            language: book.language,
            wordCount: book.words.length, // Changed from wordsCount to wordCount
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
          // 如果token过期或无效，重定向到登录页
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
      catch (error) {
        debugInfo.value.error = error instanceof Error ? error.message : '获取词书列表失败'
        uni.showToast({
          title: debugInfo.value.error,
          icon: 'none',
          duration: 2000,
        })
      }
    }

    // 执行词书切换
    const switchLexicon = async (lexicon: Lexicon) => {
      uni.showModal({
        title: '📚 确认选择',
        content: `确定要选择「${lexicon.bookName}」作为您的词书吗？`,
        success: (res) => {
          if (res.confirm) {
            try {
              // 先调用后端接口完成词书切换操作
              LexiconAPI.selectLexicon(lexicon.id)

              // 保存词书信息并立即验证
              LexiconStorage.setCurrentLexicon({
                id: lexicon.id,
                name: lexicon.bookName,
              })

              // 立即验证是否保存成功
              const savedLexicon = LexiconStorage.getCurrentLexicon()
              if (savedLexicon && savedLexicon.id === lexicon.id) {
                uni.showToast({
                  title: '🎉 选择成功！',
                  icon: 'success',
                  duration: 1500,
                  success: () => {
                    setTimeout(() => {
                      // uni.navigateBack()
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

    // 切换词书的处理函数
    const handleSwitchLexicon = async (lexicon: Lexicon) => {
      switchLexicon(lexicon)
    }

    // 初始化加载
    const initializeLexicons = async () => {
      await fetchLexicons()
      filterLexicons()
    }

    // 搜索功能
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
      // toggleSearch() // 可选：是否在搜索后关闭搜索框
    }

    // 监听语言变化 - 使用普通函数替代 watch
    const handleLanguageChange = (newLanguage: any) => {
      selectedLanguage.value = newLanguage
      fetchLexicons() // 重新获取对应语言的词书
    }

    // 下拉刷新
    const onRefresh = async () => {
      isRefreshing.value = true
      currentPage.value = 0
      allLexicons.value = []
      await fetchLexicons()
      isRefreshing.value = false
    }

    // 加载更多
    const onLoadMore = async () => {
      if (!isLastPage.value) {
        currentPage.value++
        await fetchLexicons()
      }
    }

    // 修正当前语言的获取逻辑
    onMounted(() => {
      // 确保从存储中获取正确的语言
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
      activeTab, // 保留但不使用
      displayedLexicons,
      isRefreshing,
      handleSearch,
      // handleTabChange, // 保留但不使用
      handleSwitchLexicon,
      onRefresh,
      onLoadMore,
      isSearchVisible,
      toggleSearch,
      onSearch,
      searchQuery, // 添加这一行
      handleBack,
      currentLanguage,
      debugInfo, // 添加调试信息到返回值
      selectedLanguage, // 添加到返回值中
      handleLanguageChange, // 加入到返回值中
      isLastPage,
      totalPages,
      currentPage,
    }
  },
})
</script>

<template>
  <!-- 添加返回按钮组件 -->
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

  <!-- 语言显示栏 -->
  <view class="fixed bottom-4 right-4 z-50 flex items-center rounded-lg bg-yellow px-4 py-2">
    <view :class="currentLanguage.icon" class="mr-2 text-lg" />
    <text class="text-white">
      {{ currentLanguage.displayName }}
    </text>
  </view>

  <!-- 调试信息面板 -->
  <!-- <view v-if="true" class="fixed left-4 top-20 z-50 max-h-100 w-80 overflow-auto rounded bg-white/80 p-4 shadow-lg">
    <text class="mb-2 block text-black font-bold">
      调试信息
    </text>
    <text class="mb-2 block text-black">
      选择的语言: {{ selectedLanguage.name }}
    </text>
    <text class="mb-2 block text-black">
      显示的语言: {{ currentLanguage.name }}
    </text>
    <text class="mb-2 block text-black">
      词书总数: {{ debugInfo.allBooks.length }}
    </text>
    <text class="mb-2 block text-black">
      筛选后词书数: {{ displayedLexicons.length }}
    </text>
    <view class="max-h-60 overflow-auto">
      <view v-for="book in debugInfo.allBooks" :key="book.id" class="mb-2 border rounded p-2">
        <text class="block text-black">
          名称: {{ book.bookName }}
        </text>
        <text class="block text-black">
          语言: {{ book.language }}
        </text>
        <text class="block text-black">
          描述: {{ book.description }}
        </text>
        <text class="block text-black">
          ID: {{ book.id }}
        </text>
        <text class="block text-black">
          是否匹配: {{ book.language.toLowerCase() === selectedLanguage.name.toLowerCase() }}
        </text>
      </view>
    </view>
  </view> -->

  <!-- Tab栏 -->
  <!--
  <view class="flex border-b frosted-glass">
    <view
      v-for="tab in [
        { key: 'all', label: '全部' },
        { key: 'learning', label: '学习中' },
        { key: 'completed', label: '已完成' },
        { key: 'not-started', label: '未开始' },
      ]"
      :key="tab.key"
      class="flex-1 py-3 text-center"
      :class="{ 'border-b-2 border-yellow text-yellow': activeTab === tab.key }"
      @click="handleTabChange(tab.key as 'all' | LexiconStatus)"
    >
      {{ tab.label }}
    </view>
  </view>
  -->

  <!-- 词书列表 -->
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
      <template v-if="displayedLexicons.length">
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
