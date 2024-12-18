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
    }
  },

  onLoad(options: any) {
    console.error('onLoad options:', options)
    if (options.words) {
      try {
        const decodedWords = JSON.parse(decodeURIComponent(options.words))
        console.error('Decoded words:', decodedWords)
        this.words = decodedWords
      }
      catch (error) {
        console.error('Failed to parse words data:', error)
      }
    }
  },

  computed: {
    currentWord(): Word | undefined {
      const word = this.words[this.currentIndex]
      console.error('Current word:', word)
      return word
    },
    currentCard() {
      return this.currentIndex + 1
    },
    totalCards() {
      return this.words.length
    },
    adaptedWordData(): DetailedWord {
      const word = this.currentWord
      console.error('Adapting word:', word)

      if (!word) {
        console.error('No current word, returning empty DetailedWord')
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
        console.error('添加学习日志失败:', error)
      }
    },

    async handleKnow() {
      if (this.currentWord) {
        await this.addLog(this.currentWord.id)
        this.nextWord()
      }
    },

    async handleDontKnow() {
      if (this.currentWord) {
        await this.addLog(this.currentWord.id)
        this.nextWord()
      }
    },

    nextWord() {
      if (this.currentIndex < this.words.length - 1) {
        this.currentIndex++
      }
      else {
        // 所有单词学习完成，返回首页
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
    },
  },
})
</script>

<template>
  <view class="h-full flex flex-col">
    <!-- Debug Info -->
    <view v-if="words.length === 0" class="p-4 text-red-500">
      No words loaded
    </view>

    <!-- Header -->
    <WordCardsHeader
      :current-card="currentCard"
      :total-cards="totalCards"
      :word="currentWord?.word || ''"
    />

    <!-- Content -->
    <WordCardContent
      v-if="currentWord"
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
  </view>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
