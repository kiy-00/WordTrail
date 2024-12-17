<script lang="ts">
import type { DetailedPartOfSpeech, DetailedWord } from '@/types/DetailedWord'
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

      const adaptedPartOfSpeech: DetailedPartOfSpeech[] = word.partOfSpeechList.map(pos => ({
        type: pos.type || '',
        definitions: pos.definitions ? [pos.definitions] : [],
        exampleSentences: pos.exampleSentences || [],
        gender: pos.gender || [],
        pluralForms: pos.pluralForms || [],
      }))

      return {
        id: word.id || '',
        word: word.word || '',
        language: word.language || '',
        category: word.category || [],
        partOfSpeechList: adaptedPartOfSpeech,
        phonetics: word.phonetics || [],
        exampleSentence: '',
        exampleTranslation: '',
      }
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

    async handleDifficultySelect(difficulty: 'known' | 'vague' | 'forgotten') {
      this.selectedDifficulty = difficulty
      this.showDetails = true

      if (this.currentWord) {
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
