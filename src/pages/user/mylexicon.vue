<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent, ref } from 'vue'

interface Word {
  id: number
  word: string
  phonetic: string
  translation: string
  masteryLevel: 0 | 1 | 2 // 0: 未学习, 1: 模糊, 2: 熟悉
}

interface BookResponse {
  words: Array<{
    id: number
    word: string
    phonetic: string
    translation: string
    masteryLevel: 0 | 1 | 2
  }>
}

export default defineComponent({
  name: 'MyLexicon',

  setup() {
    const activeTab = ref<'all' | '0' | '1' | '2'>('all')
    const allWords = ref<Word[]>([])
    const displayedWords = ref<Word[]>([])
    const isRefreshing = ref(false)
    const wordsPerLoad = 20
    const currentLoad = ref(1)
    const searchQuery = ref('')
    const isSearchVisible = ref(false)

    // 根据当前标签筛选单词
    const filterWords = () => {
      const filteredWords = allWords.value.filter((word) => {
        const matchesTab = activeTab.value === 'all' || word.masteryLevel === Number(activeTab.value)
        const matchesSearch = word.word.toLowerCase().includes(searchQuery.value.toLowerCase())
        return matchesTab && matchesSearch
      })
      displayedWords.value = filteredWords.slice(0, currentLoad.value * wordsPerLoad)
    }

    // 获取词书单词
    const fetchWords = async () => {
      const currentLexicon = LexiconStorage.getCurrentLexicon()
      if (!currentLexicon) {
        uni.showToast({
          title: '请先选择词书',
          icon: 'none',
        })
        return
      }

      try {
        const response = await uni.request({
          url: `${API_BASE_URL}/books/${currentLexicon.id}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${uni.getStorageSync('authToken')}`,
          },
        })

        if (response.statusCode === 200) {
          const bookData = response.data as BookResponse
          if (bookData && Array.isArray(bookData.words)) {
            allWords.value = bookData.words
            filterWords()
          }
          else {
            throw new Error('Invalid response format')
          }
        }
        else {
          uni.showToast({
            title: '获取单词列表失败',
            icon: 'none',
          })
        }
      }
      catch (error) {
        console.error('获取单词列表失败:', error)
        uni.showToast({
          title: '网络错误',
          icon: 'none',
        })
      }
    }

    // 初始化加载
    const initializeWords = async () => {
      await fetchWords()
      filterWords()
    }

    // 切换标签
    const handleTabChange = (tab: 'all' | '0' | '1' | '2') => {
      activeTab.value = tab
      currentLoad.value = 1
      filterWords()
    }

    // 搜索功能
    const handleSearch = (event: UniHelper.InputOnInputEvent) => {
      searchQuery.value = event.detail.value
      currentLoad.value = 1
      filterWords()
    }

    // 下拉刷新
    const onRefresh = async () => {
      isRefreshing.value = true
      await fetchWords()
      filterWords()
      isRefreshing.value = false
    }

    // 加载更多
    const onLoadMore = async () => {
      currentLoad.value++
      filterWords()
    }

    // 切换搜索框显示
    const toggleSearch = () => {
      isSearchVisible.value = !isSearchVisible.value
      if (!isSearchVisible.value)
        searchQuery.value = ''
    }

    const onSearch = () => {
      if (searchQuery.value.trim()) {
        filterWords()
      }
    }

    // 添加返回逻辑
    const handleBack = () => {
      uni.navigateBack()
    }

    // 点击单词显示详情
    const handleWordClick = (word: Word) => {
      uni.navigateTo({
        url: `/pages/word/detail?id=${word.id}`,
        success: (res) => {
          res.eventChannel.emit('acceptWordData', { word })
        },
      })
    }

    // 初始化
    initializeWords()

    return {
      activeTab,
      displayedWords,
      isRefreshing,
      handleTabChange,
      handleSearch,
      onRefresh,
      onLoadMore,
      toggleSearch,
      onSearch,
      isSearchVisible,
      searchQuery,
      handleBack,
      handleWordClick,
    }
  },
})
</script>

<template>
  <!-- 添加返回按钮 -->
  <BackButton @back="handleBack" />

  <!-- 顶部区域 -->
  <view class="mt-10 rounded p-4 shadow-sm frosted-glass">
    <view class="mb-4 flex items-center justify-between">
      <text class="text-xl font-bold">
        当前词书
      </text>
      <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="toggleSearch">
        <view class="i-mynaui:search text-2xl" />
      </view>
    </view>
  </view>

  <!-- 搜索栏 -->
  <transition name="fade">
    <view v-if="isSearchVisible" class="animate-fadeIn fixed left-0 right-0 top-16 z-50 px-4 py-2 shadow-md frosted-glass">
      <view class="flex items-center">
        <view class="i-mynaui:search mr-2 text-xl text-gray-400" />
        <input
          :value="searchQuery"
          type="text"
          placeholder="搜索单词..."
          class="flex-1 bg-transparent text-base outline-none"
          @input="handleSearch"
          @keydown.enter="onSearch"
        >
        <view class="i-ci:close-md ml-2 cursor-pointer text-xl" @click="toggleSearch" />
      </view>
    </view>
  </transition>

  <!-- Tab栏 -->
  <view class="mt-5 flex border-b rounded frosted-glass">
    <view
      v-for="tab in [
        { key: 'all', label: '全部' },
        { key: '0', label: '未学习' },
        { key: '1', label: '模糊' },
        { key: '2', label: '熟悉' },
      ]"
      :key="tab.key"
      class="flex-1 py-3 text-center"
      :class="{ 'border-b-2 border-yellow text-yellow': activeTab === tab.key }"
      @click="handleTabChange(tab.key as 'all' | '0' | '1' | '2')"
    >
      {{ tab.label }}
    </view>
  </view>

  <!-- 单词列表 -->
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
      <template v-for="word in displayedWords" :key="word.id">
        <WordBox
          :word="word.word"
          :phonetic="word.phonetic"
          :translation="word.translation"
          @click="handleWordClick(word)"
        />
      </template>
    </view>
  </scroll-view>
</template>

<style scoped>
.frosted-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out forwards;
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
