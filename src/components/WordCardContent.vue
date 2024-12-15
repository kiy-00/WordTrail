<script lang="ts">
import type { Word } from '@/types/Word'
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'WordCardContent',
  props: {
    wordData: {
      type: Object as PropType<Word>,
      required: true,
    },
  },
  computed: {
    pronunciation(): string {
      return this.wordData.phonetics?.[0]?.ipa || ''
    },
    definitions(): string[] {
      return this.wordData.partOfSpeechList.map(pos => `${pos.type}. ${pos.exampleSentences?.[0] || ''}`).filter(def => def.trim())
    },
  },
})
</script>

<template>
  <scroll-view class="mt-10 box-border w-full flex-1 overflow-y-auto px-5" scroll-y>
    <view class="font-verdana mb-2 text-left text-4xl font-bold">
      {{ wordData.word }}
    </view>
    <view class="mb-3 text-left text-lg">
      {{ pronunciation }}
    </view>
    <view
      v-for="(definition, index) in definitions"
      :key="index"
      class="font-verdana mb-1 text-left text-lg"
    >
      <text>{{ definition }}</text>
    </view>
  </scroll-view>
</template>

<style scoped>
.frosted-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}
</style>
