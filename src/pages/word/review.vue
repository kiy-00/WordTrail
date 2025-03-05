<script lang="ts">
import type { DetailedPartOfSpeech, DetailedWord, Example } from '@/types/DetailedWord'
import type { Word } from '@/types/Word'
import WordCardContent from '@/components/WordCardContent.vue'
import WordCardsHeader from '@/components/WordCardsHeader.vue'
import { API_BASE_URL } from '@/config/api'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    WordCardsHeader,
    WordCardContent,
  },

  data() {
    return {
      words: [] as Word[],
      currentIndex: 0,
      showDetails: false,
      selectedDifficulty: '',
    }
  },

  onLoad(options: any) {
    if (options.words) {
      try {
        const decodedWords = JSON.parse(decodeURIComponent(options.words))
        this.words = decodedWords
      }
      catch (error) {
        console.error('Failed to parse words data:', error)
      }
    }
  },

  computed: {
    currentWord(): Word | undefined {
      return this.words[this.currentIndex]
    },
    currentCard() {
      return this.currentIndex + 1
    },
    totalCards() {
      return this.words.length
    },
    adaptedWordData(): DetailedWord {
      const word = this.currentWord
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

      // 修复 adaptedPartOfSpeech 类型错误
      const adaptedPartOfSpeech: DetailedPartOfSpeech[] = word.partOfSpeechList.map((pos) => {
        // 处理 definitions - 确保是字符串数组
        const definitions: string[] = []

        if (Array.isArray(pos.definitions)) {
          for (const def of pos.definitions) {
            if (typeof def === 'string') {
              definitions.push(def)
            }
          }
        }
        else if (pos.definitions && typeof pos.definitions === 'string') {
          definitions.push(pos.definitions)
        }

        // 如果数组为空，提供默认值
        if (definitions.length === 0) {
          definitions.push('无定义')
        }

        // 处理性别 - 确保是字符串或 null
        let gender: string | null = null
        if (typeof pos.gender === 'string') {
          gender = pos.gender
        }
        else if (pos.gender && typeof pos.gender === 'object') {
          // 特别处理可能是数组或其他对象的情况
          gender = String(pos.gender)
        }

        // 处理复数形式 - 确保是字符串数组
        const pluralForms: string[] = []
        if (Array.isArray(pos.pluralForms)) {
          for (const form of pos.pluralForms) {
            if (form !== null && form !== undefined) {
              pluralForms.push(String(form))
            }
          }
        }
        else if (typeof pos.plural === 'string') {
          pluralForms.push(pos.plural)
        }

        // 处理例句 - 安全地映射为 Example[] 或 null
        let exampleSentences: Example[] | null = null

        // 使用类型断言处理例句，避免 never 类型问题
        if (pos.examples) {
          const safeExamples: Example[] = []

          // 使用类型断言将 pos.examples 转换为 any[]
          const examplesArray = pos.examples as any[]
          if (Array.isArray(examplesArray)) {
            for (let i = 0; i < examplesArray.length; i++) {
              const ex = examplesArray[i]

              // 类型检查并构建安全的例句对象
              if (ex && typeof ex === 'object') {
                const sentence = typeof ex.sentence === 'string'
                  ? ex.sentence
                  : ('sentence' in ex ? String(ex.sentence || '') : '')

                const translation = typeof ex.translation === 'string'
                  ? ex.translation
                  : ('translation' in ex ? String(ex.translation || '') : '')

                safeExamples.push({ sentence, translation })
              }
              else if (ex !== null && ex !== undefined) {
                // 如果是基础类型，则将其作为句子，无翻译
                safeExamples.push({ sentence: String(ex), translation: '' })
              }
            }
          }

          if (safeExamples.length > 0) {
            exampleSentences = safeExamples
          }
        }
        // 类似地处理 exampleSentences，使用类型断言
        else if (pos.exampleSentences) {
          const safeExamples: Example[] = []

          // 使用类型断言将 pos.exampleSentences 转换为 any[]
          const sentencesArray = pos.exampleSentences as any[]
          if (Array.isArray(sentencesArray)) {
            for (let i = 0; i < sentencesArray.length; i++) {
              const ex = sentencesArray[i]

              if (typeof ex === 'string') {
                safeExamples.push({ sentence: ex, translation: '' })
              }
              else if (ex && typeof ex === 'object') {
                const sentence = typeof ex.sentence === 'string'
                  ? ex.sentence
                  : ('sentence' in ex ? String(ex.sentence || '') : '')

                const translation = typeof ex.translation === 'string'
                  ? ex.translation
                  : ('translation' in ex ? String(ex.translation || '') : '')

                safeExamples.push({ sentence, translation })
              }
              else if (ex !== null && ex !== undefined) {
                // 处理其他情况
                safeExamples.push({ sentence: String(ex), translation: '' })
              }
            }
          }

          if (safeExamples.length > 0) {
            exampleSentences = safeExamples
          }
        }

        return {
          type: pos.type || '',
          definitions,
          exampleSentences,
          gender,
          pluralForms,
        } as DetailedPartOfSpeech
      })

      return {
        id: word.id || '',
        word: word.word || '',
        language: word.language || '',
        category: word.category || [],
        partOfSpeechList: adaptedPartOfSpeech,
        phonetics: word.phonetics || [],
        synonyms: word.synonyms || [],
        antonyms: word.antonyms || [],
        difficulty: word.difficulty,
        tags: word.tags || [],
      } as DetailedWord
    },
  },

  methods: {
    async resetReviewCount(wordId: string) {
      try {
        const token = uni.getStorageSync('token')
        const currentLexicon = LexiconStorage.getCurrentLexicon()
        if (!currentLexicon) {
          console.error('No lexicon selected')
          return
        }

        await uni.request({
          url: `${API_BASE_URL}/api/studyplan/resetcount/${currentLexicon.id}/${wordId}`,
          method: 'PUT',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
      catch (error) {
        console.error('Reset review count failed:', error)
      }
    },

    async decrementReviewCount(wordId: string) {
      try {
        const token = uni.getStorageSync('token')
        const currentLexicon = LexiconStorage.getCurrentLexicon()
        if (!currentLexicon) {
          console.error('No lexicon selected')
          return
        }

        await uni.request({
          url: `${API_BASE_URL}/api/studyplan/decrementcount/${currentLexicon.id}/${wordId}`,
          method: 'PUT',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
      catch (error) {
        console.error('Decrement review count failed:', error)
      }
    },

    async addLog(wordId: string) {
      try {
        const token = uni.getStorageSync('token')
        const currentLexicon = LexiconStorage.getCurrentLexicon()
        if (!currentLexicon)
          return

        await uni.request({
          url: `${API_BASE_URL}/api/statistics/addLog`,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
            lexicon: currentLexicon.id,
            wordId,
          },
        })
      }
      catch (error) {
        console.error('添加复习日志失败:', error)
      }
    },

    async handleDifficultySelect(difficulty: 'known' | 'vague' | 'forgotten') {
      this.selectedDifficulty = difficulty
      this.showDetails = true

      if (this.currentWord && this.currentWord.id) { // 确保 id 存在
        // 根据难度调用不同的 API
        switch (difficulty) {
          case 'forgotten':
            await this.resetReviewCount(this.currentWord.id)
            break
          case 'vague':
            await this.decrementReviewCount(this.currentWord.id)
            break
          case 'known':
            // 认识不需要调用 API
            break
        }

        // 添加学习日志
        await this.addLog(this.currentWord.id)
      }
      else {
        console.error('当前单词没有ID:', this.currentWord)
      }
    },

    nextWord() {
      if (this.currentIndex < this.words.length - 1) {
        this.currentIndex++
        this.showDetails = false
        this.selectedDifficulty = ''
      }
      else {
        uni.showToast({
          title: '本轮复习完成！',
          icon: 'none',
          duration: 2000,
        })
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/home/home' })
        }, 2000)
      }
    },
  },
})
</script>

<template>
  <view class="relative h-full flex flex-col">
    <!-- Header -->
    <WordCardsHeader
      :current-card="currentCard"
      :total-cards="totalCards"
      :word="currentWord?.word || ''"
    />

    <!-- Content -->
    <scroll-view class="mt-5 box-border flex-1 px-5 pb-32" scroll-y>
      <template v-if="currentWord">
        <!-- Word and Pronunciation -->
        <view class="font-verdana mb-2 text-left text-4xl font-bold">
          {{ currentWord.word }}
        </view>
        <view class="mb-3 text-left text-lg text-[#809bae]">
          {{ currentWord.phonetics?.[0]?.ipa || '' }}
        </view>

        <!-- Masked Content -->
        <view
          v-if="!showDetails"
          class="font-verdana mt-4 rounded-lg bg-white/20 p-5 text-center text-lg text-yellow"
        >
          选择难度查看详细释义
        </view>

        <!-- Details -->
        <template v-else>
          <WordCardContent
            :word-data="adaptedWordData"
            class="flex-1"
          />

          <!-- Next Word Button -->
          <view class="mb-4 mt-6 flex justify-center">
            <text
              class="cursor-pointer rounded-full bg-blue-500 px-8 py-3 text-white font-semibold"
              hover-class="opacity-80"
              @click="nextWord"
            >
              下一词
            </text>
          </view>
        </template>
      </template>
    </scroll-view>

    <!-- Fixed Footer -->
    <view class="fixed bottom-0 left-0 right-0 flex items-center justify-around p-6 shadow-lg frosted-glass">
      <view
        class="cursor-pointer rounded-full px-8 py-3 text-white font-semibold"
        :class="selectedDifficulty === 'known' ? 'bg-green-600' : 'bg-green-500'"
        hover-class="opacity-80"
        @click="handleDifficultySelect('known')"
      >
        认识
      </view>
      <view
        class="cursor-pointer rounded-full px-8 py-3 text-white font-semibold"
        :class="selectedDifficulty === 'vague' ? 'bg-yellow-600' : 'bg-yellow-500'"
        hover-class="opacity-80"
        @click="handleDifficultySelect('vague')"
      >
        模糊
      </view>
      <view
        class="cursor-pointer rounded-full px-8 py-3 text-white font-semibold"
        :class="selectedDifficulty === 'forgotten' ? 'bg-red-600' : 'bg-red-500'"
        hover-class="opacity-80"
        @click="handleDifficultySelect('forgotten')"
      >
        忘记
      </view>
    </view>
  </view>
</template>

<style scoped>

</style>

<route lang="json">
{
  "layout": "default"
}
</route>
