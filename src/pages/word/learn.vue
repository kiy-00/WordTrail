<script lang="ts">
import type { DetailedPartOfSpeech, DetailedWord, Example } from '@/types/DetailedWord'
import type { Word } from '@/types/Word'
import WordCardContent from '@/components/WordCardContent.vue'
import WordCardsHeader from '@/components/WordCardsHeader.vue'
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  components: {
    WordCardsHeader,
    WordCardContent,
  },

  setup() {
    // 添加调试状态
    const words = ref<Word[]>([])
    const currentIndex = ref(0)
    const isLoading = ref(false)
    const showDebug = ref(false)
    const rawWordData = ref<any>(null) // 存储原始单词数据用于调试
    const errorMessage = ref('')
    const wordIds = ref<string[]>([])

    // 获取用户ID - 可以从存储中获取，如果没有则使用默认ID
    const userId = ref(uni.getStorageSync('userInfo')?.userId || 'ed62add4-bf40-4246-b7ab-2555015b383b')

    // 计算当前单词 - 移到前面
    const currentWord = computed(() => {
      return words.value[currentIndex.value]
    })

    // 获取单词详细信息的函数 - 移动到 onMounted 之前
    const fetchWordDetails = async (wordId: string) => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        const token = uni.getStorageSync('token')
        const response = await uni.request({
          url: `http://localhost:8082/api/v1/words/${wordId}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          // 存储原始数据用于调试
          rawWordData.value = response.data

          // 将获取到的单词添加到列表
          const wordData = response.data as Word
          words.value.push(wordData)

          // eslint-disable-next-line no-console
          console.log('Fetched word details:', wordData)
        }
        else {
          errorMessage.value = `获取单词详情失败：${response.statusCode}`
          console.error('Failed to fetch word details:', response)
        }
      }
      catch (error) {
        errorMessage.value = '网络错误，请重试'
        console.error('Error fetching word details:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 从URL参数获取单词ID列表
    onMounted(() => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]

      // @ts-expect-error - 获取页面参数
      const options = currentPage.$page.options

      if (options.wordIds) {
        try {
          const decodedWordIds = JSON.parse(decodeURIComponent(options.wordIds))
          wordIds.value = decodedWordIds
          // eslint-disable-next-line no-console
          console.log('Received word IDs:', wordIds.value)

          // 开始获取第一个单词的详细信息
          if (wordIds.value.length > 0) {
            fetchWordDetails(wordIds.value[0])
          }
        }
        catch (error) {
          console.error('Failed to parse word IDs:', error)
          errorMessage.value = '解析单词ID失败'
        }
      }
    })

    // 跳转到下一个单词
    const nextWord = async () => {
      const nextIndex = currentIndex.value + 1

      // 检查是否需要加载下一个单词
      if (nextIndex >= words.value.length && nextIndex < wordIds.value.length) {
        // 加载下一个单词
        await fetchWordDetails(wordIds.value[nextIndex])
      }

      // 如果有下一个单词，则前进
      if (nextIndex < words.value.length) {
        currentIndex.value = nextIndex
      }
      else {
        // 所有单词学习完成
        uni.showToast({
          title: '本轮学习完成！',
          icon: 'none',
          duration: 2000,
        })

        setTimeout(() => {
          uni.navigateBack({
            delta: 1,
          })
        }, 2000)
      }
    }

    // 修改：使用正确的参数格式调用学习开始API
    const markWordLearningStarted = async (wordId: string) => {
      try {
        const token = uni.getStorageSync('token')
        // eslint-disable-next-line no-console
        console.log('使用原始 wordId 进行学习记录:', wordId)

        // 调用 API 接口，使用 URL 查询参数传递参数，而不是请求体
        const response = await uni.request({
          url: `http://localhost:8082/api/v1/learning/start?userId=${encodeURIComponent(userId.value)}&wordId=${encodeURIComponent(wordId)}`,
          method: 'POST',
          // 不再使用 data 字段发送 JSON
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded', // 更改为表单格式
          },
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          // eslint-disable-next-line no-console
          console.log('学习记录已添加:', response.data)
          return true
        }
        else {
          // 打印详细错误信息
          console.error('添加学习记录失败:', response)
          console.error('请求URL:', `http://localhost:8082/api/v1/learning/start?userId=${userId.value}&wordId=${wordId}`)

          // 显示更具体的错误信息
          if (response.data && response.data) {
            uni.showToast({
              title: `错误: ${response.data}`,
              icon: 'none',
              duration: 3000,
            })
          }
          return false
        }
      }
      catch (error) {
        console.error('添加学习记录失败:', error)
        return false
      }
    }
    // 处理"认识"和"不认识"按钮点击
    // 两个按钮都使用相同的学习开始API，只是UI展示不同
    const handleKnow = async () => {
      if (currentWord.value) {
        // 直接使用后端返回的原始id，不进行任何处理
        const wordId = currentWord.value.id

        if (!wordId) {
          console.error('单词对象中没有id字段:', currentWord.value)
          uni.showToast({
            title: '无法识别单词',
            icon: 'none',
          })
          return
        }

        // 调用学习开始API
        const success = await markWordLearningStarted(wordId)
        if (success) {
          // 显示提示
          uni.showToast({
            title: '已标记为认识',
            icon: 'success',
            duration: 500,
          })
          // 前进到下一个单词
          nextWord()
        }
        else {
          uni.showToast({
            title: '保存失败，请重试',
            icon: 'none',
          })
        }
      }
    }

    const handleDontKnow = async () => {
      if (currentWord.value) {
        // 同样直接使用后端返回的原始id
        const wordId = currentWord.value.id

        if (!wordId) {
          console.error('单词对象中没有id字段:', currentWord.value)
          uni.showToast({
            title: '无法识别单词',
            icon: 'none',
          })
          return
        }

        const success = await markWordLearningStarted(wordId)
        if (success) {
          uni.showToast({
            title: '已添加到学习记录',
            icon: 'none',
            duration: 500,
          })
          nextWord()
        }
        else {
          uni.showToast({
            title: '保存失败，请重试',
            icon: 'none',
          })
        }
      }
    }

    // 切换调试面板显示
    const toggleDebug = () => {
      showDebug.value = !showDebug.value
    }

    // 计算当前卡片编号和总数
    const currentCard = computed(() => {
      return currentIndex.value + 1
    })

    const totalCards = computed(() => {
      return wordIds.value.length
    })

    // 适配单词数据
    const adaptedWordData = computed(() => {
      const word = currentWord.value

      if (!word) {
        return {
          id: '',
          word: '',
          language: '',
          partOfSpeechList: [],
          phonetics: [],
          category: [],
        } as DetailedWord
      }

      // 打印原始数据用于调试
      // eslint-disable-next-line no-console
      console.log('Adapting word data:', word)
      // eslint-disable-next-line no-console
      console.log('Raw partOfSpeechList:', word.partOfSpeechList)

      // 正确处理 partOfSpeechList
      const adaptedPartOfSpeech: DetailedPartOfSpeech[] = word.partOfSpeechList.map((pos) => {
        // 1. 确保 definitions 是字符串数组
        const definitions: string[] = Array.isArray(pos.definitions)
          ? pos.definitions.filter((def): def is string => typeof def === 'string')
          : (typeof pos.definitions === 'string' ? [pos.definitions] : [])

        // 2. 处理 examples
        let formattedExamples: Example[] | null = null
        if (pos.examples && Array.isArray(pos.examples)) {
          formattedExamples = pos.examples.map(ex => ({
            sentence: ex.sentence || '',
            translation: ex.translation || '',
          }))
        }

        // 3. 返回符合 DetailedPartOfSpeech 的对象
        return {
          type: pos.type || '',
          definitions,
          exampleSentences: formattedExamples,
          gender: pos.gender,
          pluralForms: pos.pluralForms,
        } as DetailedPartOfSpeech
      })

      // 创建符合 DetailedWord 的对象
      const result: DetailedWord = {
        id: word.id || '',
        word: word.word,
        language: word.language,
        partOfSpeechList: adaptedPartOfSpeech,
        phonetics: word.phonetics,
        category: word.category,
        tags: word.tags,
        synonyms: word.synonyms,
        antonyms: word.antonyms,
        difficulty: word.difficulty,
      }

      return result
    })

    return {
      words,
      currentIndex,
      isLoading,
      showDebug,
      rawWordData,
      errorMessage,
      wordIds,
      currentWord,
      currentCard,
      totalCards,
      adaptedWordData,
      handleKnow,
      handleDontKnow,
      toggleDebug,
    }
  },
})
</script>

<template>
  <view class="h-full flex flex-col">
    <!-- Loading State -->
    <view v-if="isLoading" class="p-4 text-center">
      加载中...
    </view>

    <!-- Error Message -->
    <view v-if="errorMessage" class="p-4 text-center text-red-500">
      {{ errorMessage }}
    </view>

    <!-- Debug button -->
    <!-- <view
      class="absolute right-2 top-2 rounded-full bg-black px-3 py-1 text-sm"
      @click="toggleDebug"
    >
      调试
    </view> -->

    <!-- Debug Info Panel -->
    <!-- <view v-if="showDebug" class="fixed right-0 top-10 z-50 max-h-1/2 w-3/4 overflow-auto border rounded-lg bg-black p-4 shadow-lg">
      <view class="mb-2 font-bold">
        调试信息:
      </view>
      <view class="mb-2">
        <text>单词ID数量: {{ wordIds.length }}</text>
      </view>
      <view class="mb-2">
        <text>当前索引: {{ currentIndex }}</text>
      </view>
      <view class="mb-2">
        <text>已加载单词数: {{ words.length }}</text>
      </view>
      <view class="mb-2 max-h-40 overflow-auto">
        <text>原始单词数据:</text>
        <pre class="whitespace-pre-wrap text-xs">{{ JSON.stringify(rawWordData, null, 2) }}</pre>
      </view>
    </view> -->

    <!-- No words message -->
    <view v-if="words.length === 0 && !isLoading" class="p-4 text-center text-red-500">
      未加载任何单词
    </view>

    <!-- Word Card Content -->
    <template v-if="currentWord && !isLoading">
      <!-- Header -->
      <WordCardsHeader
        :current-card="currentCard"
        :total-cards="totalCards"
        :word="currentWord.word || ''"
        :word-id="currentWord.id || ''"
      />

      <!-- Content -->
      <WordCardContent
        :word-data="adaptedWordData"
        class="flex-1"
      />

      <!-- Footer Buttons -->
      <view class="fixed bottom-0 left-0 right-0 flex items-center justify-around p-6 shadow-lg frosted-glass">
        <view
          class="cursor-pointer rounded-full bg-red-500 px-8 py-3 text-white font-semibold"
          hover-class="opacity-80"
          @click="handleDontKnow"
        >
          不认识
        </view>
        <view
          class="cursor-pointer rounded-full bg-green-500 px-8 py-3 text-white font-semibold"
          hover-class="opacity-80"
          @click="handleKnow"
        >
          认识
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.frosted-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
