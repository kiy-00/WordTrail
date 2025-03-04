<script lang="ts">
import { LexiconStorage } from '@/utils/lexiconStorage'
import { computed, defineComponent, ref, watch } from 'vue'

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
    const wordsPerLoad = 50 // 增加每次加载的单词数量
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
    const isLoadingMore = ref(false)
    const hasMoreWords = ref(true)
    // 添加一个标志，用于检查是否需要自动加载更多
    const shouldCheckAutoLoad = ref(false)

    // 添加计算属性来获取过滤后的总单词数
    const filteredWordsCount = computed(() => {
      let filteredWords = allWords.value.filter((word) => {
        if (!word || !word.word)
          return false

        if (searchQuery.value) {
          return word.word.toLowerCase().includes(searchQuery.value.toLowerCase())
        }
        return true
      })

      if (activeTab.value !== 'all') {
        filteredWords = filteredWords.filter(word =>
          word.masteryLevel.toString() === activeTab.value,
        )
      }

      return filteredWords.length
    })

    // 获取过滤后的单词列表（不修改状态）
    function getFilteredWords() {
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

      return filteredWords
    }

    // 过滤并更新显示的单词
    const filterWords = () => {
      const filteredWords = getFilteredWords()

      // 分页处理
      const totalItems = currentLoad.value * wordsPerLoad
      displayedWords.value = filteredWords.slice(0, totalItems)

      // 更新是否有更多单词可加载
      hasMoreWords.value = displayedWords.value.length < filteredWords.length

      // 设置标志，表示需要检查自动加载
      shouldCheckAutoLoad.value = true
    }

    const onLoadMore = async () => {
      // 如果没有更多单词或者正在加载中，则返回
      if (!hasMoreWords.value || isLoadingMore.value)
        return

      isLoadingMore.value = true
      currentLoad.value++
      filterWords()
      isLoadingMore.value = false
    }

    // 使用 watch 监听标志变化，避免循环引用
    watch(shouldCheckAutoLoad, (newValue) => {
      if (newValue) {
        // 重置标志
        shouldCheckAutoLoad.value = false

        const filteredWords = getFilteredWords()
        // 检查是否需要自动加载更多
        if (displayedWords.value.length < filteredWords.length * 0.8 && !isLoadingMore.value) {
          onLoadMore()
        }
      }
    })

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

        // 先尝试从系统词书获取
        let response = await uni.request({
          url: `http://localhost:8082/api/v1/system-wordbooks/${currentLexicon.id}/words`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        // eslint-disable-next-line no-console
        console.log('fetchWords', response.data)
        // eslint-disable-next-line no-console
        console.log(currentLexicon.id)

        // 检查是否获取到数据，如果没有则尝试用户词书API
        if (response.statusCode !== 200 || !Array.isArray(response.data) || response.data.length === 0) {
          // eslint-disable-next-line no-console
          console.log('系统词书API未返回有效数据，尝试用户词书API')

          response = await uni.request({
            url: `http://localhost:8082/api/v1/user-wordbooks/${currentLexicon.id}/words`,
            method: 'GET',
            header: {
              Authorization: `Bearer ${token}`,
            },
          })
        }

        debugInfo.value.rawResponse = response.data
        // eslint-disable-next-line no-console
        console.log('fetchWords', response.data)

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

    const updateCurrentLexiconName = () => {
      const lexicon = LexiconStorage.getCurrentLexicon()
      currentLexiconName.value = lexicon?.name || '未选择词书'
    }

    // 其他方法保持不变
    const initializeWords = async () => {
      await fetchWords()
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

    // 添加一个方法来一次性加载所有单词
    const loadAllWords = () => {
      const totalWords = filteredWordsCount.value
      const loadsRequired = Math.ceil(totalWords / wordsPerLoad)
      currentLoad.value = loadsRequired
      filterWords()

      uni.showToast({
        title: '已加载全部单词',
        icon: 'none',
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
      filteredWordsCount, // 添加计算属性到返回值
      hasMoreWords, // 添加是否有更多单词的状态
      loadAllWords, // 添加加载所有单词的方法
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <view class="mt-10 rounded p-4 shadow-sm frosted-glass">
    <view class="mb-4 flex items-center justify-between">
      <view class="flex flex-col">
        <text class="text-base">
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
