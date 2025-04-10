<script lang="ts">
import type { DetailedPartOfSpeech, DetailedWord, Example } from '@/types/DetailedWord'
import type { Word } from '@/types/Word'
import WordCardContent from '@/components/WordCardContent.vue'
import WordCardsHeader from '@/components/WordCardsHeader.vue'
import { API_BASE_URL } from '@/config/api'
import { LearnSettingsStorage } from '@/utils/learnSettingsStorage'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent } from 'vue'

// 定义学习记录接口
interface LearningProgress {
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

// 新增：复习结果记录
interface ReviewResult {
  wordId: string
  result: boolean
  stage: number
}

export default defineComponent({
  components: {
    WordCardsHeader,
    WordCardContent,
  },

  data() {
    return {
      words: [] as Word[], // 实际要显示的单词数据
      learningRecords: [] as LearningProgress[], // 学习记录数据
      reviewResults: [] as ReviewResult[], // 新增：复习结果记录
      currentIndex: 0,
      showDetails: false,
      selectedDifficulty: '',
      hasResponded: false, // 添加新状态，标记用户是否已经做出选择
      isLoading: false,
      errorMessage: '',
      userId: '', // 用户ID
      batchSize: 10, // 默认批次大小
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
    currentLearningRecord(): LearningProgress | null {
      return this.learningRecords[this.currentIndex] || null
    },
  },

  created() {
    // 获取用户ID
    this.userId = uni.getStorageSync('userInfo')?.userId || 'ed62add4-bf40-4246-b7ab-2555015b383b'

    // 获取批次大小
    const settings = LearnSettingsStorage.getSettings()
    this.batchSize = settings.wordsPerGroup || 10
  },

  onLoad() {
    // 页面加载时获取今日需要复习的单词
    this.fetchTodayReviewWords()
  },

  methods: {
    // 新增：获取今天需要复习的单词
    async fetchTodayReviewWords() {
      try {
        this.isLoading = true
        this.errorMessage = ''

        const token = uni.getStorageSync('token')
        const currentLexicon = LexiconStorage.getCurrentLexicon()

        if (!currentLexicon) {
          this.errorMessage = '请先选择词书'
          uni.showToast({
            title: '请先选择词书',
            icon: 'none',
          })
          return
        }

        // 调用API获取今日需要复习的单词学习记录，使用批次大小限制
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/learning/today-review?userId=${this.userId}&bookId=${currentLexicon.id}&limit=${this.batchSize}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          // 保存学习记录数据
          this.learningRecords = response.data as LearningProgress[]
          // eslint-disable-next-line no-console
          console.log('获取到的学习记录:', this.learningRecords)

          if (this.learningRecords.length === 0) {
            uni.showToast({
              title: '今天没有需要复习的单词',
              icon: 'none',
              duration: 2000,
            })

            // 延迟返回上一页
            setTimeout(() => {
              uni.navigateBack()
            }, 2000)
            return
          }

          // 获取第一个单词的详细信息
          await this.fetchWordDetails()
        }
        else {
          this.errorMessage = '获取复习单词失败'
          console.error('获取复习单词失败:', response)
        }
      }
      catch (error) {
        this.errorMessage = '网络错误，请稍后再试'
        console.error('获取复习单词失败:', error)
      }
      finally {
        this.isLoading = false
      }
    },

    // 新增：获取单词详细信息
    async fetchWordDetails() {
      if (!this.learningRecords[this.currentIndex]) {
        return
      }

      try {
        const token = uni.getStorageSync('token')
        const wordId = this.learningRecords[this.currentIndex].wordId

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/words/${wordId}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && response.data) {
          // 设置当前单词数据
          this.words[this.currentIndex] = response.data as Word
          // eslint-disable-next-line no-console
          console.log('获取到的单词详情:', this.words[this.currentIndex])
        }
        else {
          console.error('获取单词详情失败:', response)
        }
      }
      catch (error) {
        console.error('获取单词详情失败:', error)
      }
    },

    // 修改：处理用户选择的难度 - 添加防重复点击逻辑
    async handleDifficultySelect(difficulty: 'known' | 'vague' | 'forgotten') {
      // 如果已经做出选择，则不允许再次点击
      if (this.hasResponded) {
        return
      }

      // 标记已经做出选择
      this.hasResponded = true
      this.selectedDifficulty = difficulty
      this.showDetails = true

      if (!this.currentWord || !this.currentLearningRecord) {
        return
      }

      // 获取当前单词ID和学习记录
      const wordId = this.currentLearningRecord.wordId
      // 修正：只有"认识"情况remembered为true，其他情况为false
      const remembered = difficulty === 'known'
      const stage = this.currentLearningRecord.reviewStage // 保存当前阶段

      try {
        const token = uni.getStorageSync('token')

        // 使用复习API记录单词复习结果
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/learning/review?userId=${this.userId}&wordId=${wordId}&remembered=${remembered}`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })

        if (response.statusCode === 200) {
          // eslint-disable-next-line no-console
          console.log('复习记录成功:', response.data)

          // 保存复习结果以供批量提交
          this.reviewResults.push({
            wordId,
            result: remembered, // 使用remembered作为结果
            stage,
          })

          // 如果是API返回了更新后的学习记录，更新本地数据
          const updatedRecord = response.data as LearningProgress
          if (updatedRecord) {
            // 更新当前学习记录
            this.learningRecords[this.currentIndex] = updatedRecord
          }
        }
        else {
          console.error('复习记录失败:', response)
        }

        // 移除旧的API调用，不再需要根据难度调用不同的API
        // 所有难度现在都使用同一个API，只是remembered参数不同
      }
      catch (error) {
        console.error('更新学习状态失败:', error)
      }
    },

    // 修改：移动到下一个单词 - 重置选择状态
    async nextWord() {
      if (this.currentIndex < this.learningRecords.length - 1) {
        this.currentIndex++
        this.showDetails = false
        this.selectedDifficulty = ''
        this.hasResponded = false // 重置选择状态，允许对下一个单词做出选择

        // 获取下一个单词的详细信息
        await this.fetchWordDetails()
      }
      else {
        // 所有单词复习完成，提交总体复习记录
        await this.submitBatchReviewResults()

        uni.showToast({
          title: '本轮复习完成！',
          icon: 'success',
          duration: 2000,
        })

        setTimeout(() => {
          uni.navigateBack()
        }, 2000)
      }
    },

    // 新增：提交批量复习结果
    async submitBatchReviewResults() {
      if (this.reviewResults.length === 0) {
        return
      }

      try {
        const token = uni.getStorageSync('token')

        // 构建请求体
        const requestBody = {
          type: 'review', // 因为是复习，所以类型是review
          words: this.reviewResults,
        }

        // 发送批量复习记录
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/learning-records/${this.userId}`,
          method: 'POST',
          data: requestBody,
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200) {
          // eslint-disable-next-line no-console
          console.log('批量复习记录提交成功:', response.data)
        }
        else {
          console.error('批量复习记录提交失败:', response)
        }
      }
      catch (error) {
        console.error('批量复习记录提交失败:', error)
      }
    },
  },
})
</script>

<template>
  <view class="relative h-full flex flex-col">
    <!-- 加载状态 -->
    <view v-if="isLoading" class="flex flex-1 items-center justify-center">
      <view class="text-center">
        <view class="i-carbon:progress-bar animate-spin text-2xl" />
        <text class="mt-2 block">
          加载中...
        </text>
      </view>
    </view>

    <!-- 错误信息 -->
    <view v-if="errorMessage" class="p-4 text-center text-red-500">
      {{ errorMessage }}
    </view>

    <!-- 正常内容区域 -->
    <template v-if="!isLoading && !errorMessage && currentWord">
      <!-- Header -->
      <WordCardsHeader
        :current-card="currentIndex + 1"
        :total-cards="learningRecords.length"
        :word="currentWord?.word || ''"
        :word-id="currentWord?.id || ''"
      />

      <!-- Content -->
      <scroll-view class="mt-5 box-border flex-1 px-5 pb-32" scroll-y>
        <!-- 单词 -->
        <view class="font-verdana mb-1 text-left text-4xl font-bold">
          {{ currentWord.word }}
        </view>
        <!-- 发音 -->
        <view class="mb-4 text-left text-lg text-[#809bae]">
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
          <view class="fixed bottom-30 right-6 z-10">
            <text
              class="cursor-pointer rounded-full bg-blue-500 px-8 py-3 text-white font-semibold shadow-lg"
              hover-class="opacity-80"
              @click="nextWord"
            >
              下一词
            </text>
          </view>
        </template>
      </scroll-view>

      <!-- Fixed Footer -->
      <view class="fixed bottom-0 left-0 right-0 flex items-center justify-around p-6 shadow-lg frosted-glass">
        <view
          class="cursor-pointer rounded-full px-8 py-3 text-white font-semibold"
          :class="[
            selectedDifficulty === 'known' ? 'bg-green-600' : 'bg-green-500',
            hasResponded && selectedDifficulty !== 'known' ? 'opacity-50 cursor-not-allowed' : '',
          ]"
          hover-class="opacity-80"
          @click="handleDifficultySelect('known')"
        >
          认识
        </view>

        <view
          class="cursor-pointer rounded-full px-8 py-3 text-white font-semibold"
          :class="[
            selectedDifficulty === 'vague' ? 'bg-yellow-600' : 'bg-yellow-500',
            hasResponded && selectedDifficulty !== 'vague' ? 'opacity-50 cursor-not-allowed' : '',
          ]"
          hover-class="opacity-80"
          @click="handleDifficultySelect('vague')"
        >
          模糊
        </view>

        <view
          class="cursor-pointer rounded-full px-8 py-3 text-white font-semibold"
          :class="[
            selectedDifficulty === 'forgotten' ? 'bg-red-600' : 'bg-red-500',
            hasResponded && selectedDifficulty !== 'forgotten' ? 'opacity-50 cursor-not-allowed' : '',
          ]"
          hover-class="opacity-80"
          @click="handleDifficultySelect('forgotten')"
        >
          忘记
        </view>
      </view>
    </template>
  </view>
</template>

<route lang="json">
{
  "layout": "default"
}
</route>
