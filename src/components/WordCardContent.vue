<script lang="ts">
import type { DetailedPartOfSpeech, DetailedWord } from '@/types/DetailedWord'
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'WordCardContent',
  props: {
    wordData: {
      type: Object as PropType<DetailedWord>,
      required: true,
    },
  },
  computed: {
    pronunciation(): string {
      return this.wordData.phonetics?.[0]?.ipa || ''
    },
    definitions(): string[] {
      return this.wordData.partOfSpeechList.map((pos: DetailedPartOfSpeech) => {
        const parts: string[] = []

        // Add part of speech type
        parts.push(pos.type)

        // Add definitions if available
        if (pos.definitions && pos.definitions.length > 0) {
          parts.push(pos.definitions.join('; '))
        }

        // Add gender information if available
        if (pos.gender && pos.gender.length > 0) {
          parts.push(`(${pos.gender.join(', ')})`)
        }

        // Add plural forms if available
        if (pos.pluralForms && pos.pluralForms.length > 0) {
          parts.push(`[pl: ${pos.pluralForms.join(', ')}]`)
        }

        return parts.join(' ')
      }).filter(def => def.trim())
    },
    examples(): string[] {
      return this.wordData.partOfSpeechList
        .flatMap(pos => pos.exampleSentences || [])
        .filter((example): example is string => example !== null && example !== undefined)
    },
  },
})
</script>

<template>
  <scroll-view class="mt-10 box-border w-full flex-1 overflow-y-auto px-5" scroll-y>
    <!-- Word and Pronunciation -->
    <view class="font-verdana mb-2 text-left text-4xl font-bold">
      {{ wordData.word }}
    </view>
    <view v-if="pronunciation" class="mb-3 text-left text-lg">
      {{ pronunciation }}
    </view>

    <!-- Definitions -->
    <view
      v-for="(definition, index) in definitions"
      :key="index"
      class="font-verdana mb-1 text-left text-lg"
    >
      <text>{{ definition }}</text>
    </view>

    <!-- Example Sentences -->
    <view v-if="examples.length > 0">
      <view
        v-for="(example, index) in examples"
        :key="`example-${index}`"
        class="font-verdana mt-5 rounded-lg p-5 text-left frosted-glass"
      >
        <text class="text-xl">
          {{ example }}
        </text>
      </view>
    </view>
  </scroll-view>
</template>

<style scoped>
</style>
