<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent, ref } from 'vue'

interface Phonetic {
  ipa: string
  audio: string
}

interface PartOfSpeech {
  type: string
  definitions: string
  gender?: string | null
}

// 更新后的Word接口
interface Word {
  id: string
  word: string
  language: string
  partOfSpeechList: PartOfSpeech[]
  phonetics: Phonetic[]
  masteryLevel: number
}

interface WordCount {
  wordId: string
  count: number
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
    const debugInfo = ref({
      rawResponse: null as any,
      currentLexicon: null as any,
      error: '',
    })
    const wordCounts = ref<WordCount[]>([])
    const currentLexiconName = ref('')

    const updateWordMasteryLevels = () => {
      allWords.value = allWords.value.map((word) => {
        const wordCount = wordCounts.value.find(wc => wc.wordId === word.id)
        const count = wordCount ? wordCount.count : 0
        return {
          ...word,
          masteryLevel: count === 0 ? 0 : count === 1 ? 1 : 2,
        }
      })
    }

    const filterWords = () => {
      // 先根据搜索关键字过滤
      let filteredWords = allWords.value.filter((word) => {
        if (!word || !word.word)
          return false

        // 如果有搜索关键字，则根据关键字过滤
        if (searchQuery.value) {
          return word.word.toLowerCase().includes(searchQuery.value.toLowerCase())
        }
        return true
      })

      // 再根据标签过滤
      if (activeTab.value !== 'all') {
        filteredWords = filteredWords.filter(word =>
          word.masteryLevel.toString() === activeTab.value,
        )
      }

      // 分页处理
      displayedWords.value = filteredWords.slice(0, currentLoad.value * wordsPerLoad)
    }

    const fetchWords = async () => {
      const currentLexicon = LexiconStorage.getCurrentLexicon()
      debugInfo.value.currentLexicon = currentLexicon

      if (!currentLexicon) {
        uni.showToast({
          title: '请先选择词书',
          icon: 'none',
        })
        return
      }

      try {
        const token = uni.getStorageSync('token')
        const response = await uni.request({
          url: `${API_BASE_URL}/books/${currentLexicon.id}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        debugInfo.value.rawResponse = response.data
        console.error('fetchWords', response.data)

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          // 保持原始数据结构，只添加 masteryLevel
          const processedWords: Word[] = response.data.map(wordData => ({
            ...wordData,
            masteryLevel: 0, // 默认未学习状态
          })).filter(word => word.word)

          if (processedWords.length > 0) {
            allWords.value = processedWords
            debugInfo.value.error = ''
            filterWords()
          }
          else {
            throw new Error('词书为空')
          }
        }
        else {
          throw new Error(`请求失败: ${response.statusCode}`)
        }
      }
      catch (error) {
        debugInfo.value.error = `请求错误: ${error}`
        console.error('获取词书失败:', error)
        uni.showToast({
          title: '获取单词列表失败',
          icon: 'none',
        })
      }
    }

    const fetchWordsCount = async () => {
      const currentLexicon = LexiconStorage.getCurrentLexicon()
      debugInfo.value.currentLexicon = currentLexicon

      if (!currentLexicon) {
        uni.showToast({
          title: '请先选择词书',
          icon: 'none',
        })
        return
      }

      try {
        const token = uni.getStorageSync('token')
        console.error('fetchWordsCount id', currentLexicon.id)
        console.error('fetchWordsCount token', token)
        const response = await uni.request({
          url: `${API_BASE_URL}/api/lexicon/count`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
            lexiconId: `${currentLexicon.id}`,
          },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          wordCounts.value = response.data
          updateWordMasteryLevels()
          filterWords()
        }
        else {
          throw new Error(`请求失败: ${response.statusCode}`)
        }
      }
      catch (error) {
        debugInfo.value.error = `请求错误: ${error}`
        console.error('获取词书失败:', error)
        uni.showToast({
          title: '获取单词列表失败',
          icon: 'none',
        })
      }
    }

    const updateCurrentLexiconName = () => {
      const lexicon = LexiconStorage.getCurrentLexicon()
      currentLexiconName.value = lexicon?.name || '未选择词书'
    }

    // 其他方法保持不变
    const initializeWords = async () => {
      await fetchWords()
      await fetchWordsCount()
      filterWords()
    }

    const handleTabChange = (tab: 'all' | '0' | '1' | '2') => {
      activeTab.value = tab
      currentLoad.value = 1
      filterWords()
    }

    const handleSearch = (event: UniHelper.InputOnInputEvent) => {
      searchQuery.value = event.detail.value
      currentLoad.value = 1 // 重置加载页数
      filterWords()
    }

    const onRefresh = async () => {
      isRefreshing.value = true
      await fetchWords()
      filterWords()
      isRefreshing.value = false
    }

    const onLoadMore = async () => {
      currentLoad.value++
      filterWords()
    }

    const toggleSearch = () => {
      isSearchVisible.value = !isSearchVisible.value
      if (!isSearchVisible.value) {
        searchQuery.value = ''
        filterWords() // 清空搜索时重新过滤
      }
    }

    const onSearch = () => {
      if (searchQuery.value.trim()) {
        currentLoad.value = 1 // 重置加载页数
        filterWords()
      }
    }

    const handleBack = () => {
      uni.navigateBack()
    }

    const handleWordClick = (word: Word) => {
      uni.navigateTo({
        url: `/pages/word/detail?id=${word.id}`,
        success: (res) => {
          res.eventChannel.emit('acceptWordData', { word })
        },
      })
    }

    initializeWords()
    updateCurrentLexiconName()

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
      debugInfo,
      allWords, // 添加这一行
      wordCounts,
      currentLexiconName,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <view class="mt-10 rounded p-4 shadow-sm frosted-glass">
    <view class="mb-4 flex items-center justify-between">
      <view class="flex flex-col">
        <text class="text-base text-gray-500">
          当前词书
        </text>
        <text class="mt-1 text-xl font-bold">
          {{ currentLexiconName }}
        </text>
      </view>
      <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="toggleSearch">
        <view class="i-mynaui:search text-2xl" />
      </view>
    </view>
  </view>

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

  <view class="mt-5 flex border-b rounded frosted-glass">
    <view
      v-for="tab in [
        { key: 'all', label: '全部', count: allWords.length },
        { key: '0', label: '未学习', count: allWords.filter(w => w.masteryLevel === 0).length },
        { key: '1', label: '模糊', count: allWords.filter(w => w.masteryLevel === 1).length },
        { key: '2', label: '熟悉', count: allWords.filter(w => w.masteryLevel === 2).length },
      ]"
      :key="tab.key"
      class="relative flex-1 py-3 text-center"
      :class="{ 'border-b-2 border-yellow text-yellow': activeTab === tab.key }"
      @click="handleTabChange(tab.key as 'all' | '0' | '1' | '2')"
    >
      <text>{{ tab.label }}</text>
      <view class="count-badge" :class="{ 'count-badge-active': activeTab === tab.key }">
        {{ tab.count }}
      </view>
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
      <template v-for="word in displayedWords" :key="word.id">
        <WordBox
          :word-data="word"
          @click="handleWordClick(word)"
        />
      </template>
    </view>
  </scroll-view>

  <!-- <view class="fixed left-4 top-20 z-50 max-h-100 w-80 overflow-auto rounded bg-white/80 p-4 shadow-lg">
    <text class="mb-2 block font-bold">
      调试信息
    </text>
    <text class="mb-2 block">
      当前词书: {{ debugInfo.currentLexicon?.name || '未选择' }}
    </text>
    <text class="mb-2 block">
      词书ID: {{ debugInfo.currentLexicon?.id || '无' }}
    </text>
    <text class="mb-2 block">
      错误信息: {{ debugInfo.error || '无' }}
    </text>
    <view class="mb-2">
      <text class="font-bold">
        原始响应:
      </text>
      <pre class="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs">{{ JSON.stringify(debugInfo.rawResponse, null, 2) }}</pre>
    </view>
    <view class="mb-2">
      <text class="font-bold">
        已处理数据:
      </text>
      <view class="mt-1 max-h-40 overflow-auto">
        <view v-for="word in displayedWords" :key="word.id" class="mb-1 text-xs">
          {{ word.word }}
          [{{ word.phonetics?.[0]?.ipa || '' }}] -
          {{ word.partOfSpeechList?.[0]?.type || '未知' }}
        </view>
      </view>
    </view>
  </view> -->
</template>

<style scoped>
.count-badge {
  position: absolute;
  top: 0;
  right: 4px;
  background-color: #666;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-badge-active {
  background-color: #fbbf24;
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
