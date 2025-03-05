<script lang="ts">
import type { PropType } from 'vue'
import { defineComponent } from 'vue'

interface Phonetic {
  ipa: string
  audio: string
}

interface PartOfSpeech {
  type: string
  definitions: string[] // 已是字符串数组
  gender?: string | null
  plural?: string
  examples?: Array<{
    sentence: string
    translation: string
  }>
}

// 修改 WordData 接口以完全匹配后端返回的实际数据
interface WordData {
  _id?: {
    timestamp: number
    date: string
  }
  id?: string
  word: string
  language: string
  difficulty?: number
  synonyms?: string[]
  antonyms?: string[]
  partOfSpeechList: PartOfSpeech[]
  phonetics: Phonetic[]
  tags?: string[]
  masteryLevel?: number
}

export default defineComponent({
  name: 'WordBox',
  props: {
    wordData: {
      type: Object as PropType<WordData>,
      required: true,
    },
  },
  computed: {
    // 添加计算属性来获取适当的ID
    wordId(): string {
      if (this.wordData.id)
        return this.wordData.id
      if (this.wordData._id?.timestamp)
        return this.wordData._id.timestamp.toString()
      return ''
    },
  },
  methods: {
    handleClick() {
      this.$emit('click')
    },
    // Helper method to limit array items
    limitItems<T>(items: T[] | undefined | null, limit: number = 3): T[] {
      if (!items)
        return []
      return items.slice(0, limit)
    },
  },
})
</script>

<template>
  <view class="mb-4 rounded-lg px-4 py-4 frosted-glass">
    <view class="flex flex-col cursor-pointer" @click="handleClick">
      <!-- Word and Phonetics -->
      <view class="flex flex-row items-center justify-between">
        <view class="text-lg font-bold">
          {{ wordData.word }}
        </view>
        <view class="flex gap-2">
          <view
            v-for="(phonetic, index) in limitItems(wordData.phonetics)"
            :key="index"
            class="text-sm text-gray-500"
          >
            [{{ phonetic.ipa }}]
          </view>
        </view>
      </view>

      <!-- Part of Speech, Definitions, and Gender -->
      <view class="mt-3 space-y-2">
        <view
          v-for="(pos, index) in limitItems(wordData.partOfSpeechList)"
          :key="index"
          class="text-sm"
        >
          <view class="flex items-center gap-2">
            <span class="text-blue-600">{{ pos.type }}</span>
            <span v-if="pos.gender" class="text-xs text-gray-500">({{ pos.gender }})</span>
          </view>
          <view class="mt-1 text-gray-600">
            <!-- 处理多个定义 - 现在假设 definitions 始终是数组 -->
            {{ pos.definitions.join('; ') }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.frosted-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}
</style>
