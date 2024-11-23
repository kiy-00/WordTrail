<script lang="ts">
import { defineComponent } from 'vue'

interface WordData {
  word: string
  pronunciation: string
  definitions: string[]
  example: string
  exampleTranslation: string
}

export default defineComponent({

  data() {
    return {
      words: [
        {
          word: 'hybrid',
          pronunciation: '/ˈhaɪbrɪd/',
          definitions: [
            'n. 杂交动物或植物；合成物',
            'adj. 杂交的；合成的；混合动力的',
          ],
          example: 'In biology, a hybrid is an animal or a plant produced from two different species.',
          exampleTranslation: '在生物学上，“杂种”就是由两种不同的物种繁殖出的动物或植物。',
        },
        {
          word: 'adapt',
          pronunciation: '/əˈdæpt/',
          definitions: ['v. 适应；改编'],
          example: 'She quickly adapted to the new environment.',
          exampleTranslation: '她很快适应了新环境。',
        },
        {
          word: 'bilingual',
          pronunciation: '/ˌbaɪˈlɪŋɡwəl/',
          definitions: ['adj. 双语的；能说两种语言的'],
          example: 'Being bilingual can open up many career opportunities.',
          exampleTranslation: '会说两种语言可以带来许多职业机会。',
        },
        {
          word: 'culture',
          pronunciation: '/ˈkʌltʃər/',
          definitions: ['n. 文化；教养；培养'],
          example: 'The festival is a celebration of local culture.',
          exampleTranslation: '这个节日是对当地文化的庆祝。',
        },
        {
          word: 'diverse',
          pronunciation: '/daɪˈvɜːrs/',
          definitions: ['adj. 多种多样的；不同的'],
          example: 'The city is known for its diverse population.',
          exampleTranslation: '这座城市以其多元化的人口而闻名。',
        },
        {
          word: 'efficient',
          pronunciation: '/ɪˈfɪʃnt/',
          definitions: ['adj. 高效的；效率高的'],
          example: 'Solar panels are an efficient source of energy.',
          exampleTranslation: '太阳能电池板是一种高效的能源来源。',
        },
        {
          word: 'fluent',
          pronunciation: '/ˈfluːənt/',
          definitions: ['adj. 流利的；流畅的'],
          example: 'She is fluent in three languages.',
          exampleTranslation: '她会流利地说三种语言。',
        },
        {
          word: 'global',
          pronunciation: '/ˈɡloʊbl/',
          definitions: ['adj. 全球的；全局的'],
          example: 'Climate change is a global issue that requires urgent action.',
          exampleTranslation: '气候变化是一个需要紧急应对的全球性问题。',
        },
        {
          word: 'synergy',
          pronunciation: '/ˈsɪnərdʒi/',
          definitions: ['n. 协同作用；增效作用'],
          example: 'The synergy between departments led to improved productivity.',
          exampleTranslation: '各部门之间的协同作用提高了生产力。',
        },
        {
          word: 'resilient',
          pronunciation: '/rɪˈzɪliənt/',
          definitions: ['adj. 有弹性的；适应力强的'],
          example: 'The material is highly resilient, able to withstand great pressure.',
          exampleTranslation: '这种材料非常有弹性，能够承受巨大的压力。',
        },
        // 总共10个单词
      ] as WordData[],
      currentIndex: 0,
    }
  },
  computed: {
    currentWord() {
      return this.words[this.currentIndex]
    },
    currentCard() {
      return this.currentIndex + 1 // 显示从1开始
    },
    totalCards() {
      return this.words.length // 总单词数
    },
  },
  methods: {
    onNextWord(): void {
      if (this.currentIndex < this.words.length - 1) {
        this.currentIndex++
      }
      else {
        uni.showToast({
          title: '您已经完成了本轮学习!',
          icon: 'none',
          duration: 2000,
        })
        this.currentIndex = 0
        uni.navigateTo({
          url: '/pages/home/home',
        })
      }
    },
    onForgot(): void {
      uni.showToast({
        title: '记错了！',
        icon: 'none',
        duration: 2000,
      })
    },
  },
})
</script>

<template>
  <!-- Wordcard Header -->
  <WordCardsHeader :current-card="currentCard" :total-cards="totalCards" :word="currentWord.word" />

  <!-- Wordcard Content -->
  <scroll-view class="mt-10 box-border w-full flex-1 overflow-y-auto px-5" scroll-y>
    <view class="font-verdana mb-2 text-left text-4xl font-bold">
      {{ currentWord.word }}
    </view>
    <view class="mb-3 text-left text-lg">
      {{ currentWord.pronunciation }}
    </view>
    <view v-for="(definition, index) in currentWord.definitions" :key="index" class="font-verdana mb-1 text-left text-lg">
      <text>{{ definition }}</text>
    </view>
    <view class="font-verdana mt-5 rounded-lg p-5 text-left frosted-glass">
      <text class="text-xl">
        {{ currentWord.example }}
      </text>
      <br>
      <text class="text-lg">
        {{ currentWord.exampleTranslation }}
      </text>
    </view>
  </scroll-view>

  <!-- Wordcard Footer -->
  <view class="flex items-center justify-around py-7">
    <!-- Next Word Button -->
    <view class="flex flex-col cursor-pointer items-center" @click="onNextWord">
      <text class="text-base font-sans">
        下一词
      </text>
      <view class="mt-1 h-1 w-5 rounded bg-[#4caf50]" />
    </view>

    <!-- Forgot Button -->
    <view class="flex flex-col cursor-pointer items-center" @click="onForgot">
      <text class="text-base font-sans">
        记错了
      </text>
      <view class="mt-1 h-1 w-5 rounded bg-[#f44336]" />
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
