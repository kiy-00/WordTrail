<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

interface Word {
  _id: string // 修改为字符串类型的ObjectId
  word: string
  language: string
  difficulty: number
  synonyms: string[]
  antonyms: string[]
  partOfSpeechList: Array<{
    type: string
    definitions: string[]
    gender?: string
    plural?: string
    examples?: Array<{
      sentence: string
      translation: string
    }>
  }>
  phonetics: Array<{
    ipa: string
    audio: string
  }>
  tags: string[]
}

// 新增WordData接口来匹配WordBox组件所需的类型
interface WordData {
  _id: {
    timestamp: number
    date: string
  }
  word: string
  language: string
  difficulty: number
  synonyms: string[]
  antonyms: string[]
  partOfSpeechList: Array<{
    type: string
    definitions: string[]
    gender?: string
    plural?: string
    examples?: Array<{
      sentence: string
      translation: string
    }>
  }>
  phonetics: Array<{
    ipa: string
    audio: string
  }>
  tags: string[]
}

interface SystemWordbook {
  id: string
  bookName: string
  description: string
  language: string
  createUser: string
  words: string[] // 这里存储的是单词ID列表 (ObjectId形式)
}

export default defineComponent({
  name: 'LexiconDetail',
  setup() {
    const id = ref('')
    const lexiconDetail = ref<SystemWordbook | null>(null)
    const loading = ref(true)
    const words = ref<Word[]>([])
    const loadingWords = ref(false)
    const currentPage = ref(0)
    const pageSize = ref(10)
    const totalWords = ref(0)
    const hasMoreWords = ref(true)

    // 先定义 loadWords 函数
    const loadWords = async () => {
      // 添加空值检查，确保 lexiconDetail.value 不为 null
      if (!lexiconDetail.value || !lexiconDetail.value.words.length)
        return

      try {
        loadingWords.value = true
        const token = uni.getStorageSync('token')

        const startIndex = currentPage.value * pageSize.value
        const endIndex = Math.min(startIndex + pageSize.value, lexiconDetail.value.words.length)
        const wordIds = lexiconDetail.value.words.slice(startIndex, endIndex)

        // 如果已经加载了所有单词
        if (startIndex >= lexiconDetail.value.words.length) {
          hasMoreWords.value = false
          return
        }

        // 并行请求多个单词的详细信息
        const wordPromises = wordIds.map(wordId =>
          uni.request({
            url: `${API_BASE_URL}/api/v1/words/${wordId}`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        )

        const responses = await Promise.all(wordPromises)

        const newWords = responses
          .filter(response => response.statusCode === 200 && response.data)
          .map(response => response.data as Word)

        words.value = [...words.value, ...newWords]

        // 更新页码和检查是否还有更多
        currentPage.value++
        hasMoreWords.value = words.value.length < lexiconDetail.value.words.length
      }
      catch (error) {
        uni.showToast({
          title: '获取单词信息失败',
          icon: 'none',
          duration: 2000,
        })
        console.error('加载单词失败:', error)
      }
      finally {
        loadingWords.value = false
      }
    }

    // 之后定义使用 loadWords 的函数
    const fetchLexiconDetail = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000,
          })
          uni.redirectTo({ url: '/pages/user/login' })
          return
        }

        loading.value = true

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/system-wordbooks/${id.value}`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200) {
          lexiconDetail.value = response.data as SystemWordbook
          console.error('词书详情:', lexiconDetail.value)
          // 添加空值检查
          if (lexiconDetail.value) {
            totalWords.value = lexiconDetail.value.words.length
            // 初始加载词书的前10个单词
            await loadWords()
          }
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
          throw new Error('获取词书详情失败')
        }
      }
      catch (error) {
        uni.showToast({
          title: '获取词书详情失败',
          icon: 'none',
          duration: 2000,
        })
        console.error(error)
      }
      finally {
        loading.value = false
      }
    }

    const handleBack = () => {
      uni.navigateBack()
    }

    // 选定该词书
    const selectLexicon = async () => {
      // 添加空值检查
      if (!lexiconDetail.value)
        return

      uni.showModal({
        title: '📚 确认选择',
        content: `确定要选择「${lexiconDetail.value.bookName}」作为您的词书吗？`,
        success: (res) => {
          if (res.confirm) {
            try {
              // 添加空值检查
              if (lexiconDetail.value) {
                // 保存到本地存储
                uni.setStorageSync('currentLexicon', {
                  id: lexiconDetail.value.id,
                  name: lexiconDetail.value.bookName,
                })
              }

              uni.showToast({
                title: '选择成功',
                icon: 'success',
                duration: 2000,
              })

              setTimeout(() => {
                uni.navigateBack()
              }, 2000)
            }
            catch (error) {
              uni.showToast({
                title: '选择失败，请重试',
                icon: 'none',
                duration: 2000,
              })
              console.error(error)
            }
          }
        },
      })
    }

    // 打开单词详情 - 修改为使用完整的ObjectId
    const openWordDetail = (word: Word) => {
      uni.navigateTo({
        url: `/pages/word/worddetail?id=${word._id}`,
      })
    }

    // 添加转换函数，将Word类型转换为WordData类型
    const convertToWordData = (word: Word): WordData => {
      return {
        ...word,
        _id: {
          timestamp: Date.now(),
          date: new Date().toISOString(),
        },
      }
    }

    // 滚动到底部时加载更多单词
    const onScrollToLower = () => {
      if (!loadingWords.value && hasMoreWords.value) {
        loadWords()
      }
    }

    onMounted(() => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as any
      const options = currentPage.$page?.options

      if (options) {
        id.value = options.id || ''
        fetchLexiconDetail()
      }
    })

    return {
      id,
      lexiconDetail,
      loading,
      words,
      loadingWords,
      hasMoreWords,
      totalWords,
      handleBack,
      selectLexicon,
      openWordDetail,
      onScrollToLower,
      loadWords, // 添加这一行，暴露 loadWords 函数给模板使用
      convertToWordData, // 添加转换函数到返回值中
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <scroll-view
    class="h-screen"
    :scroll-y="true"
    @scrolltolower="onScrollToLower"
  >
    <view class="p-4">
      <!-- 加载状态 -->
      <view v-if="loading" class="h-80 flex items-center justify-center">
        <view class="i-tabler:loader-2 animate-spin text-4xl text-yellow" />
      </view>

      <!-- 词书详情 -->
      <template v-else-if="lexiconDetail">
        <!-- 词书标题和图标 -->
        <view class="mb-6 flex flex-col items-center justify-center">
          <view class="mb-3 h-32 w-32 flex items-center justify-center rounded-lg bg-yellow-50">
            <view class="i-carbon:book text-6xl text-yellow" />
          </view>
          <view class="text-2xl text-yellow font-bold">
            {{ lexiconDetail.bookName }}
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="mb-6 rounded-lg bg-gray-50 p-4 shadow-sm">
          <view class="mb-2 text-lg text-yellow font-bold">
            基本信息
          </view>
          <view class="mb-2">
            <text class="text-gray-600 font-bold">
              描述：
            </text>
            <text class="text-gray-700">
              {{ lexiconDetail.description }}
            </text>
          </view>
          <view class="mb-2">
            <text class="text-gray-600 font-bold">
              语言：
            </text>
            <text class="text-gray-700">
              {{ lexiconDetail.language }}
            </text>
          </view>
          <view class="mb-2">
            <text class="text-gray-600 font-bold">
              创建者：
            </text>
            <text class="text-gray-700">
              {{ lexiconDetail.createUser }}
            </text>
          </view>
          <view class="mb-2">
            <text class="text-gray-600 font-bold">
              单词数量：
            </text>
            <text class="text-gray-700">
              {{ totalWords }}
            </text>
          </view>
        </view>

        <!-- 单词列表 -->
        <view class="mb-6">
          <view class="mb-3 flex items-center justify-between">
            <text class="text-lg text-yellow font-bold">
              单词列表
            </text>
            <text class="text-sm text-gray-500">
              {{ words.length }}/{{ totalWords }}
            </text>
          </view>

          <!-- 单词卡片 - 使用转换函数将Word类型转换为WordData类型 -->
          <view v-if="words.length > 0">
            <WordBox
              v-for="word in words"
              :key="word._id"
              :word-data="convertToWordData(word)"
              class="mb-4"
              @click="openWordDetail(word)"
            />

            <!-- 加载更多指示器 -->
            <view v-if="loadingWords" class="my-4 flex justify-center">
              <view class="i-tabler:loader-2 animate-spin text-2xl text-yellow" />
            </view>

            <!-- 加载更多按钮 -->
            <view v-else-if="hasMoreWords" class="my-4 flex justify-center">
              <button
                class="rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-600"
                @click="loadWords"
              >
                加载更多
              </button>
            </view>

            <!-- 已加载全部提示 -->
            <view v-else class="my-4 text-center text-sm text-gray-500">
              已加载全部单词
            </view>
          </view>

          <!-- 无单词状态 -->
          <view v-else-if="!loadingWords" class="py-10 text-center text-gray-500">
            词书中暂无单词
          </view>

          <!-- 初始加载状态 -->
          <view v-else class="h-40 flex items-center justify-center">
            <view class="i-tabler:loader-2 animate-spin text-2xl text-yellow" />
          </view>
        </view>

        <!-- 选择按钮 -->
        <button
          class="mb-8 w-full rounded-lg bg-yellow py-3 text-white font-bold"
          @click="selectLexicon"
        >
          选择此词书
        </button>
      </template>

      <!-- 无数据状态 -->
      <view v-else class="h-80 flex flex-col items-center justify-center">
        <view class="i-carbon:document-error mb-2 text-4xl text-gray-400" />
        <text class="text-gray-500">
          找不到词书信息
        </text>
      </view>
    </view>
  </scroll-view>
</template>

<route lang="json">
{
  "layout": "default"
}
</route>

<style scoped>
</style>
