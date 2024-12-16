<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent, ref } from 'vue'

// 前端展示用的类型
interface Word {
  id: string
  word: string
  phonetic: string
  translation: string
  masteryLevel: number // 将类型从 '0 | 1 | 2' 修改为 'number'
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

    // 根据当前标签筛选单词
    const filterWords = () => {
      const filteredWords = allWords.value.filter((word) => {
        if (!word || !word.word)
          return false // 添加空值检查
        const matchesTab = activeTab.value === 'all' || word.masteryLevel === Number(activeTab.value)
        const matchesSearch = searchQuery.value ? word.word.toLowerCase().includes(searchQuery.value.toLowerCase()) : true
        return matchesTab && matchesSearch
      })
      displayedWords.value = filteredWords.slice(0, currentLoad.value * wordsPerLoad)
    }

    // 修改获取词书单词的函数
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

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          // 处理词书数组
          const processedWords: Word[] = response.data.map(wordData => ({
            id: wordData.id || '',
            word: wordData.word || '',
            phonetic: wordData.phonetics?.[0]?.ipa || '',
            translation: wordData.partOfSpeechList?.[0]?.type || '未知',
            masteryLevel: 0, // 确保这里赋值的类型是 number
          })).filter(word => word.word) // 过滤掉没有单词的数据

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
        console.error('获取词书失败:', error) // 添加错误日志
        uni.showToast({
          title: '获取单词列表失败',
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
      debugInfo,
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

  <!-- 调试信息面板 -->
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
          {{ word.word }} [{{ word.phonetic }}] - {{ word.translation }}
        </view>
      </view>
    </view>
  </view> -->
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
