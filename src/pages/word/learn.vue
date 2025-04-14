<script lang="ts">
import type { DetailedPartOfSpeech, DetailedWord, Example } from '@/types/DetailedWord'
import type { Word } from '@/types/Word'
import WordCardContent from '@/components/WordCardContent.vue'
import WordCardsHeader from '@/components/WordCardsHeader.vue'
import { API_BASE_URL } from '@/config/api'
import { LearnSettingsStorage } from '@/utils/learnSettingsStorage'
import { computed, defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  components: {
    WordCardsHeader,
    WordCardContent,
  },

  setup() {
    const words = ref<Word[]>([])
    const currentIndex = ref(0)
    const isLoading = ref(false)
    const showDebug = ref(false)
    const rawWordData = ref<any>(null)
    const errorMessage = ref('')
    const wordIds = ref<string[]>([])
    const showWordDetails = ref(false)
    const hasResponded = ref(false) // 添加标记变量，防止自动跳转

    const learnSettings = ref(LearnSettingsStorage.getSettings())
    const wordsPerGroup = computed(() => learnSettings.value.wordsPerGroup)

    const userId = ref(uni.getStorageSync('userInfo')?.userId || 'ed62add4-bf40-4246-b7ab-2555015b383b')

    const currentWord = computed(() => {
      return words.value[currentIndex.value]
    })

    const fetchWordDetails = async (wordId: string) => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        const token = uni.getStorageSync('token')
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/words/${wordId}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          rawWordData.value = response.data
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

    onMounted(() => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]

      // 使用类型断言处理页面参数
      const options = (currentPage as any).options

      if (options.wordIds) {
        try {
          const decodedWordIds = JSON.parse(decodeURIComponent(options.wordIds))
          wordIds.value = decodedWordIds
          // eslint-disable-next-line no-console
          console.log('Received word IDs:', wordIds.value)

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

    const finishLearning = () => {
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

    const nextWord = async () => {
      showWordDetails.value = false
      hasResponded.value = false // 重置响应状态

      const nextIndex = currentIndex.value + 1

      if (nextIndex >= words.value.length && nextIndex < wordIds.value.length) {
        await fetchWordDetails(wordIds.value[nextIndex])
      }

      if (nextIndex < words.value.length) {
        currentIndex.value = nextIndex
      }
      else {
        finishLearning()
      }
    }

    const markWordLearningStarted = async (wordId: string) => {
      try {
        const token = uni.getStorageSync('token')
        // eslint-disable-next-line no-console
        console.log('使用原始 wordId 进行学习记录:', wordId)

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/learning/start?userId=${encodeURIComponent(userId.value)}&wordId=${encodeURIComponent(wordId)}`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          // eslint-disable-next-line no-console
          console.log('学习记录已添加:', response.data)
          return true
        }
        else {
          console.error('添加学习记录失败:', response)
          console.error('请求URL:', `${API_BASE_URL}/api/v1/learning/start?userId=${userId.value}&wordId=${wordId}`)

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

    const handleKnow = async () => {
      if (hasResponded.value)
        return

      hasResponded.value = true

      if (currentWord.value) {
        showWordDetails.value = true

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
            title: '已标记为认识',
            icon: 'success',
            duration: 1000,
          })
        }
        else {
          uni.showToast({
            title: '保存失败，请重试',
            icon: 'none',
          })
          hasResponded.value = false
        }
      }
    }

    const handleDontKnow = async () => {
      if (hasResponded.value)
        return

      hasResponded.value = true

      if (currentWord.value) {
        showWordDetails.value = true

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
            duration: 1000,
          })
        }
        else {
          uni.showToast({
            title: '保存失败，请重试',
            icon: 'none',
          })
          hasResponded.value = false
        }
      }
    }

    const toggleDebug = () => {
      showDebug.value = !showDebug.value
    }

    const currentCard = computed(() => {
      return currentIndex.value + 1
    })

    const totalCards = computed(() => {
      return Math.min(wordIds.value.length, wordsPerGroup.value)
    })

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

      // eslint-disable-next-line no-console
      console.log('Adapting word data:', word)
      // eslint-disable-next-line no-console
      console.log('Raw partOfSpeechList:', word.partOfSpeechList)

      const adaptedPartOfSpeech: DetailedPartOfSpeech[] = word.partOfSpeechList.map((pos) => {
        const definitions: string[] = Array.isArray(pos.definitions)
          ? pos.definitions.filter((def): def is string => typeof def === 'string')
          : (typeof pos.definitions === 'string' ? [pos.definitions] : [])

        let formattedExamples: Example[] | null = null
        if (pos.examples && Array.isArray(pos.examples)) {
          formattedExamples = pos.examples.map(ex => ({
            sentence: ex.sentence || '',
            translation: ex.translation || '',
          }))
        }

        return {
          type: pos.type || '',
          definitions,
          exampleSentences: formattedExamples,
          gender: pos.gender,
          pluralForms: pos.pluralForms,
        } as DetailedPartOfSpeech
      })

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
      showWordDetails,
      nextWord,
      hasResponded,
    }
  },
})
</script>

<template>
  <view class="h-full flex flex-col">
    <view v-if="isLoading" class="p-4 text-center">
      加载中...
    </view>

    <view v-if="errorMessage" class="p-4 text-center text-red-500">
      {{ errorMessage }}
    </view>

    <template v-if="currentWord && !isLoading">
      <WordCardsHeader
        :current-card="currentCard"
        :total-cards="totalCards"
        :word="currentWord.word || ''"
        :word-id="currentWord.id || ''"
      />

      <WordCardContent
        :word-data="adaptedWordData"
        :minimal="!showWordDetails"
        class="flex-1"
      />

      <view v-if="showWordDetails" class="fixed bottom-30 right-6 z-10">
        <text
          class="cursor-pointer rounded-full bg-blue-500 px-8 py-3 text-white font-semibold shadow-lg"
          hover-class="opacity-80"
          @click="nextWord"
        >
          下一词
        </text>
      </view>

      <view class="fixed bottom-0 left-0 right-0 flex items-center justify-around p-6 shadow-lg frosted-glass">
        <view
          class="cursor-pointer rounded-full px-8 py-3 text-white font-semibold"
          :class="[
            hasResponded ? 'bg-red-300' : 'bg-red-500',
            hasResponded ? 'cursor-not-allowed' : 'cursor-pointer',
          ]"
          hover-class="opacity-80"
          @click="handleDontKnow"
        >
          不认识
        </view>
        <view
          class="cursor-pointer rounded-full px-8 py-3 text-white font-semibold"
          :class="[
            hasResponded ? 'bg-green-300' : 'bg-green-500',
            hasResponded ? 'cursor-not-allowed' : 'cursor-pointer',
          ]"
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

.opacity-0 {
  opacity: 0;
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
