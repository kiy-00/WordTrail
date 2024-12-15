<script lang="ts">
import type { Word } from '@/types/Word'
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const word = ref<Word | null>(null)

    // 修正获取 eventChannel 的方法
    onLoad(() => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as any
      const eventChannel = currentPage.$getAppWebview().eventChannel

      eventChannel.on('acceptWordData', (data: { word: Word }) => {
        word.value = data.word
      })
    })

    const handleBack = () => {
      uni.navigateBack()
    }

    // 计算属性获取音标
    const getPhonetic = computed(() => {
      return word.value?.phonetics?.[0]?.ipa || ''
    })

    return {
      word,
      handleBack,
      getPhonetic,
    }
  },
})
</script>

<template>
  <view class="min-h-screen p-4">
    <BackButton @back="handleBack" />

    <view v-if="word" class="mt-4 rounded-lg p-6 frosted-glass">
      <!-- 单词标题 -->
      <view class="mb-6 text-center">
        <text class="text-4xl font-bold">
          {{ word.word }}
        </text>
      </view>

      <!-- 音标 -->
      <view class="mb-6 text-center">
        <text class="text-xl text-gray-600">
          [{{ getPhonetic }}]
        </text>
      </view>

      <!-- 词性和释义 -->
      <view v-for="(pos, index) in word.partOfSpeechList" :key="index" class="mb-4">
        <text class="font-bold">
          {{ pos.type }}
        </text>
        <view v-if="pos.exampleSentences?.length" class="mt-2 pl-4">
          <view v-for="(sentence, sIndex) in pos.exampleSentences" :key="sIndex" class="mb-2">
            <text>{{ sentence }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
