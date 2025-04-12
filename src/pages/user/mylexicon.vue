<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { computed, defineComponent, ref, watch } from 'vue'

interface Phonetic {
  ipa: string
  audio: string
}

interface PartOfSpeech {
  type: string
  definitions: string[] // 修改为字符串数组
  gender?: string | null
  plural?: string
  examples?: Array<{
    sentence: string
    translation: string
  }>
}

interface Word {
  id?: string
  _id?: {
    timestamp: number
    date: string
  }
  word: string
  language: string
  difficulty?: number
  synonyms?: string[]
  antonyms?: string[]
  partOfSpeechList: PartOfSpeech[]
  phonetics: Phonetic[]
  tags?: string[]
  masteryLevel?: number // 保持可选，因为原始数据可能没有这个字段
}

interface LearningRecord {
  id: string
  userId: string
  wordId: string
  proficiency: number
  lastReviewTime: string
  firstLearnTime: string
  nextReviewTime: string
  reviewStage: number
  reviewHistory: Array<{
    reviewTime: string | null
    remembered: boolean
  }>
}

export default defineComponent({
  name: 'MyLexicon',

  setup() {
    const activeTab = ref<'all' | 'unlearned' | 'newly' | 'fuzzy' | 'familiar'>('all')
    const allWords = ref<Word[]>([])
    const displayedWords = ref<Word[]>([])
    const isRefreshing = ref(false)
    const wordsPerLoad = 50
    const currentLoad = ref(1)
    const searchQuery = ref('')
    const isSearchVisible = ref(false)
    const debugInfo = ref({
      rawResponse: null as any,
      currentLexicon: null as any,
      error: '',
      apiStatus: '',
      recordsCount: 0,
    })
    const currentLexiconName = ref('')
    const isLoadingMore = ref(false)
    const hasMoreWords = ref(true)
    const shouldCheckAutoLoad = ref(false)
    const userId = ref('ed62add4-bf40-4246-b7ab-2555015b383b') // 用户ID
    const showDebug = ref(false)

    const toggleDebug = () => {
      showDebug.value = !showDebug.value
    }

    const logRawResponse = () => {
      // eslint-disable-next-line no-console
      console.log('原始响应数据:', debugInfo.value.rawResponse)
    }

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
          word.masteryLevel !== undefined && word.masteryLevel.toString() === activeTab.value,
        )
      }

      return filteredWords.length
    })

    // 获取过滤后的单词列表（不修改状态）
    function getFilteredWords() {
      // 先根据搜索关键字过滤
      const filteredWords = allWords.value.filter((word) => {
        if (!word || !word.word)
          return false

        // 如果有搜索关键字，则根据关键字过滤
        if (searchQuery.value) {
          return word.word.toLowerCase().includes(searchQuery.value.toLowerCase())
        }
        return true
      })

      // 不再根据标签过滤，因为fetchWords已经根据标签获取了相应的单词
      // 每个标签对应不同的API，返回的是已经过滤好的单词

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

    // 获取单词详细信息
    const fetchWordDetails = async (wordId: string): Promise<Word | null> => {
      try {
        const token = uni.getStorageSync('token')
        const response: UniApp.RequestSuccessCallbackResult = await uni.request({
          url: `${API_BASE_URL}/api/v1/words/${wordId}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        }) as UniApp.RequestSuccessCallbackResult

        if (response.statusCode === 200 && response.data) {
          // 使用类型断言，确保返回正确的Word类型
          const wordData = response.data as unknown as Word

          // 如果 masteryLevel 未定义，则设置默认值
          if (wordData.masteryLevel === undefined) {
            wordData.masteryLevel = 0
          }

          return wordData
        }
        return null
      }
      catch (error) {
        console.error('获取单词详情失败:', error)
        return null
      }
    }

    // 获取学习记录并转换为单词，包含掌握程度
    const fetchLearningRecords = async (tabType: string) => {
      const currentLexicon = LexiconStorage.getCurrentLexicon()
      if (!currentLexicon) {
        return []
      }

      try {
        const token = uni.getStorageSync('token')
        let url = ''

        switch (tabType) {
          case 'unlearned':
            url = `${API_BASE_URL}/api/v1/learning/book/${currentLexicon.id}/unlearned-words?userId=${userId.value}`
            break
          case 'newly':
            url = `${API_BASE_URL}/api/v1/learning/book/${currentLexicon.id}/newly-learned-words?userId=${userId.value}`
            break
          case 'fuzzy':
            url = `${API_BASE_URL}/api/v1/learning/book/${currentLexicon.id}/fuzzy-words?userId=${userId.value}`
            break
          case 'familiar':
            url = `${API_BASE_URL}/api/v1/learning/book/${currentLexicon.id}/familiar-words?userId=${userId.value}`
            break
          default:
            return [] // 对于 'all' 标签，使用 fetchAllWords 函数
        }

        const response = await uni.request({
          url,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          debugInfo.value.recordsCount = response.data.length
          return response.data as LearningRecord[]
        }
        return []
      }
      catch (error) {
        console.error(`获取${tabType}单词记录失败:`, error)
        return []
      }
    }

    // 确保获取的单词数据都有 masteryLevel 字段
    const ensureMasteryLevel = (word: Word, defaultLevel: number = 0): Word => {
      if (word.masteryLevel === undefined) {
        return { ...word, masteryLevel: defaultLevel }
      }
      return word
    }

    // 获取"全部"单词（从系统词书或用户词书）
    const fetchAllWords = async () => {
      const currentLexicon = LexiconStorage.getCurrentLexicon()
      if (!currentLexicon) {
        return []
      }

      try {
        const token = uni.getStorageSync('token')

        // 先尝试从系统词书获取
        let response = await uni.request({
          url: `${API_BASE_URL}/api/v1/system-wordbooks/${currentLexicon.id}/words`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        // 检查是否获取到数据，如果没有则尝试用户词书API
        if (response.statusCode !== 200 || !Array.isArray(response.data) || response.data.length === 0) {
          // eslint-disable-next-line no-console
          console.log('系统词书API未返回有效数据，尝试用户词书API')

          response = await uni.request({
            url: `${API_BASE_URL}/api/v1/user-wordbooks/${currentLexicon.id}/words`,
            method: 'GET',
            header: {
              Authorization: `Bearer ${token}`,
            },
          })
        }

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          // 保持原始数据结构，只添加 masteryLevel (如果没有)
          const processedWords: Word[] = response.data.map((wordData) => {
            const word = wordData as unknown as Word
            return ensureMasteryLevel(word, 0) // 默认未学习状态
          }).filter(word => word.word)

          debugInfo.value.apiStatus = '成功'
          return processedWords
        }
        debugInfo.value.apiStatus = '失败'
        return []
      }
      catch (error) {
        debugInfo.value.apiStatus = '错误'
        console.error('获取全部单词失败:', error)
        return []
      }
    }

    // 主要的获取单词函数
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
        allWords.value = [] // 清空现有单词

        // 根据当前标签页确定获取方式
        if (activeTab.value === 'all') {
          // 获取全部单词（从系统词书或用户词书）
          const words = await fetchAllWords()

          if (words.length > 0) {
            allWords.value = words
          }
          else {
            throw new Error('词书为空')
          }
        }
        else {
          // 获取指定掌握程度的单词
          const records = await fetchLearningRecords(activeTab.value)

          // 获取单词详情并合并成最终的单词列表
          const wordsPromises = records.map(async (record) => {
            const wordDetail = await fetchWordDetails(record.wordId)
            if (wordDetail) {
              return {
                ...wordDetail,
                masteryLevel: activeTab.value === 'unlearned' ? 0 : activeTab.value === 'newly' ? 1 : activeTab.value === 'fuzzy' ? 2 : 3,
                proficiency: record.proficiency,
                lastReviewTime: record.lastReviewTime,
              } as Word
            }
            return null
          })

          // 等待所有单词详情请求完成
          const words = (await Promise.all(wordsPromises)).filter(word => word !== null) as Word[]

          if (words.length > 0) {
            allWords.value = words
          }
          else {
            // 替换为提示信息而非抛出错误
            allWords.value = [] // 设置为空数组
            const masteryText = activeTab.value === 'unlearned' ? '未学习' : activeTab.value === 'newly' ? '新学' : activeTab.value === 'fuzzy' ? '模糊' : '熟悉'
            uni.showToast({
              title: `未找到任何${masteryText}单词`,
              icon: 'none',
              duration: 2000,
            })
          }
        }

        debugInfo.value.error = ''
        filterWords()
        debugInfo.value.rawResponse = allWords.value
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

    const handleTabChange = async (tab: 'all' | 'unlearned' | 'newly' | 'fuzzy' | 'familiar') => {
      if (tab !== activeTab.value) {
        activeTab.value = tab
        currentLoad.value = 1

        // 切换标签时重新获取数据
        isRefreshing.value = true
        await fetchWords()
        filterWords()
        isRefreshing.value = false
      }
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

    // 由于后端返回的数据格式已经与 WordBox 组件期望的格式一致，
    // 我们不再需要适配器函数，但我们需要处理 id 字段
    const adaptWordForWordBox = (word: Word): any => {
      // 确保 WordBox 组件能够正确识别单词 ID
      return {
        ...word,
        id: word.id || (word._id?.timestamp?.toString() || ''),
      }
    }

    initializeWords()
    updateCurrentLexiconName()

    // 监听搜索词变化，更新所有显示
    watch(searchQuery, () => {
      filterWords()
    })

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
      allWords,
      currentLexiconName,
      filteredWordsCount,
      hasMoreWords,
      loadAllWords,
      adaptWordForWordBox,
      showDebug,
      toggleDebug,
      logRawResponse,
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
      <view class="flex items-center">
        <!-- <view class="mr-3 h-6 w-6 flex cursor-pointer items-center justify-center" @click="toggleDebug">
          <view class="i-mynaui:code text-2xl" />
        </view> -->
        <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="toggleSearch">
          <view class="i-mynaui:search text-2xl" />
        </view>
      </view>
    </view>
  </view>

  <!-- 调试面板 -->
  <!-- <view v-if="showDebug" class="debug-panel mb-2 border border-yellow-500 rounded p-3">
    <view class="mb-2 flex justify-between">
      <text class="font-bold">
        调试信息
      </text>
      <text class="cursor-pointer text-red-500" @click="toggleDebug">
        关闭
      </text>
    </view>
    <scroll-view style="max-height: 300px;" scroll-y>
      <view class="mb-2">
        <text class="text-sm font-bold">
          当前标签: {{ activeTab }}
        </text>
      </view>
      <view class="mb-2">
        <text class="text-sm font-bold">
          API状态: {{ debugInfo.apiStatus }}
        </text>
      </view>
      <view class="mb-2">
        <text class="text-sm font-bold">
          学习记录数: {{ debugInfo.recordsCount }}
        </text>
      </view>
      <view class="mb-2">
        <text class="text-sm font-bold">
          单词数: {{ allWords.length }}
        </text>
      </view>
      <view class="mb-2">
        <text class="text-sm font-bold">
          显示单词数: {{ displayedWords.length }}
        </text>
      </view>
      <view class="mb-2">
        <text class="text-sm font-bold">
          错误信息: {{ debugInfo.error || "无" }}
        </text>
      </view>
      <view class="mb-2">
        <button class="rounded bg-yellow-500 px-2 py-1 text-sm text-white" @click="logRawResponse">
          查看原始响应
        </button>
      </view>
    </scroll-view>
  </view> -->

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
        { key: 'all', label: '全部' },
        { key: 'unlearned', label: '未学习' },
        { key: 'newly', label: '新学' },
        { key: 'fuzzy', label: '模糊' },
        { key: 'familiar', label: '熟悉' },
      ]"
      :key="tab.key"
      class="relative flex-1 py-3 text-center"
      :class="{ 'border-b-2 border-yellow text-yellow': activeTab === tab.key }"
      @click="handleTabChange(tab.key as 'all' | 'unlearned' | 'newly' | 'fuzzy' | 'familiar')"
    >
      <text>{{ tab.label }}</text>
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
          :word-data="adaptWordForWordBox(word)"
          @click="handleWordClick(word)"
        />
      </template>
    </view>

    <!-- 加载更多按钮 -->
    <view v-if="hasMoreWords" class="py-4 text-center">
      <text class="cursor-pointer text-yellow" @click="onLoadMore">
        加载更多
      </text>
    </view>

    <!-- 没有更多单词提示 -->
    <view v-else class="py-4 text-center text-gray-400">
      <text>已经到底了</text>
    </view>
  </scroll-view>
</template>

<style scoped>
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
