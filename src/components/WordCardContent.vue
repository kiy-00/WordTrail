<script lang="ts">
import type { DetailedWord } from '@/types/DetailedWord'
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

    // 显示词性和定义
    partOfSpeechInfo(): Array<{
      type: string
      definitions: string[]
      gender?: string | null
      plural?: string | undefined
      examples?: Array<{ sentence: string, translation: string }> | undefined
    }> {
      return this.wordData.partOfSpeechList.map((pos) => {
        // 确保 definitions 始终是非空的字符串数组
        let definitions: string[] = []
        if (Array.isArray(pos.definitions)) {
          definitions = pos.definitions.filter(def => typeof def === 'string') as string[]
        }

        // 处理示例句子 - 更安全的实现
        let examples

        // 新增：正确处理后端返回的examples字段
        if (pos.examples && Array.isArray(pos.examples) && pos.examples.length > 0) {
          examples = pos.examples.map(ex => ({
            sentence: ex && typeof ex === 'object' && 'sentence' in ex ? ex.sentence || '' : '',
            translation: ex && typeof ex === 'object' && 'translation' in ex ? ex.translation || '' : '',
          }))
        }
        // 向后兼容：尝试使用exampleSentences字段
        else if (pos.exampleSentences && Array.isArray(pos.exampleSentences) && pos.exampleSentences.length > 0) {
          examples = []
          for (let i = 0; i < pos.exampleSentences.length; i++) {
            const ex = pos.exampleSentences[i]
            if (typeof ex === 'string') {
              examples.push({ sentence: ex, translation: '' })
            }
            else if (ex && typeof ex === 'object' && 'sentence' in ex) {
              examples.push({
                sentence: ex.sentence || '',
                translation: ex.translation || '',
              })
            }
          }
        }

        return {
          type: pos.type,
          definitions: definitions.length > 0 ? definitions : ['无定义'],
          gender: pos.gender,
          plural: Array.isArray(pos.pluralForms) ? pos.pluralForms[0] : (pos.plural || undefined),
          examples,
        }
      })
    },

    // 获取所有示例句
    allExamples(): Array<{ sentence: string, translation: string }> {
      const examples: Array<{ sentence: string, translation: string }> = []

      this.partOfSpeechInfo.forEach((pos) => {
        if (pos.examples && pos.examples.length > 0) {
          examples.push(...pos.examples)
        }
      })

      return examples
    },

    // 获取单词的标签
    tags(): string[] {
      // 调试标签数据
      // eslint-disable-next-line no-console
      console.log('Tags data:', this.wordData.tags)

      // 确保标签始终是字符串数组
      if (this.wordData.tags && Array.isArray(this.wordData.tags)) {
        return this.wordData.tags.filter(tag => typeof tag === 'string')
      }
      return []
    },

    // 安全访问同义词
    synonyms(): string[] {
      return this.wordData.synonyms || []
    },

    // 安全访问反义词
    antonyms(): string[] {
      return this.wordData.antonyms || []
    },

    // 安全访问难度值
    difficulty(): number {
      return typeof this.wordData.difficulty === 'number' ? this.wordData.difficulty : 0
    },
  },

  // 添加生命周期钩子，在组件挂载后打印原始数据以便调试
  mounted() {
    // eslint-disable-next-line no-console
    console.log('WordCardContent mounted with data:', this.wordData)
    // eslint-disable-next-line no-console
    console.log('PartOfSpeechList:', this.wordData.partOfSpeechList)
    // eslint-disable-next-line no-console
    console.log('Tags:', this.wordData.tags)
  },
})
</script>

<template>
  <scroll-view class="mt-6 box-border w-full flex-1 overflow-y-auto px-5" scroll-y>
    <!-- 修改：将单词和发音分两行显示 -->
    <!-- 单词 -->
    <view class="mb-1 flex flex-col">
      <text class="font-verdana text-3xl font-bold">
        {{ wordData.word }}
      </text>
      <!-- 发音 -->
      <text v-if="pronunciation" class="mt-1 text-lg text-gray-500">
        [{{ pronunciation }}]
      </text>
    </view>

    <!-- Tags -->
    <view v-if="tags && tags.length > 0" class="mb-3 mt-5 flex flex-wrap gap-1">
      <text
        v-for="(tag, idx) in tags"
        :key="idx"
        class="rounded bg-yellow px-2 py-1 text-xs font-bold"
      >
        {{ tag }}
      </text>
    </view>

    <!-- Part of Speech and Definitions -->
    <view v-for="(pos, posIndex) in partOfSpeechInfo" :key="`pos-${posIndex}`" class="mb-5">
      <!-- 词性、性别和复数形式 -->
      <view class="mb-2 mt-5 flex flex-wrap items-center gap-2">
        <text class="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700 font-semibold">
          {{ pos.type }}
        </text>
        <text v-if="pos.gender" class="text-sm">
          {{ pos.gender }}
        </text>
        <text v-if="pos.plural" class="text-sm italic">
          {{ pos.plural }}
        </text>
      </view>

      <!-- 定义列表 -->
      <view class="mb-3 ml-1">
        <view v-for="(def, defIndex) in pos.definitions" :key="`def-${posIndex}-${defIndex}`" class="mb-1 flex">
          <text class="mr-2">
            •
          </text>
          <text class="text-base">
            {{ def }}
          </text>
        </view>
      </view>

      <!-- 例句(显示在当前词性下方) -->
      <view v-if="pos.examples && Array.isArray(pos.examples) && pos.examples.length > 0" class="mb-3 ml-3 space-y-2">
        <view v-for="(ex, exIndex) in pos.examples" :key="`ex-${posIndex}-${exIndex}`" class="rounded-md bg-blue-500 p-2">
          <text class="block text-base font-medium">
            {{ ex.sentence }}
          </text>
          <text v-if="ex.translation" class="block text-sm">
            {{ ex.translation }}
          </text>
        </view>
      </view>
    </view>

    <!-- 同义词/反义词 (可选) -->
    <view v-if="synonyms.length > 0" class="mt-4">
      <text class="mb-4 block text-left text-sm font-semibold">
        同义词:
      </text>
      <view class="flex flex-wrap gap-1">
        <text
          v-for="(syn, synIndex) in synonyms"
          :key="`syn-${synIndex}`"
          class="rounded bg-green-50 px-2 py-1 text-sm text-green-700"
        >
          {{ syn }}
        </text>
      </view>
    </view>

    <view v-if="antonyms.length > 0" class="mt-3">
      <text class="mb-1 block text-left text-sm font-semibold">
        反义词:
      </text>
      <view class="flex flex-wrap gap-1">
        <text
          v-for="(ant, antIndex) in antonyms"
          :key="`ant-${antIndex}`"
          class="rounded bg-red-50 px-2 py-1 text-sm text-red-700"
        >
          {{ ant }}
        </text>
      </view>
    </view>

    <!-- 难度指示器 (可选) - 修改使文本靠左 -->
    <view v-if="difficulty > 0" class="mb-3 mt-5">
      <text class="mb-5 block text-left text-sm">
        难度:
      </text>
      <view class="mt-1 flex justify-start">
        <view
          v-for="n in 5"
          :key="n"
          class="mx-0.5 h-2 w-6 rounded first:ml-0" :class="[
            n <= difficulty ? 'bg-yellow-500' : 'bg-gray-200',
          ]"
        />
      </view>
    </view>
  </scroll-view>
</template>

<style scoped>
/* 可以添加额外样式 */
</style>
