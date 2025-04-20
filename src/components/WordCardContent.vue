<script lang="ts">
import type { DetailedWord } from '@/types/DetailedWord'
import { generateExampleSentence } from '@/services/openai'
import { defineComponent, onMounted, type PropType, ref, watch } from 'vue'

export default defineComponent({
  name: 'WordCardContent',
  props: {
    wordData: {
      type: Object as PropType<DetailedWord>,
      required: true,
    },
    minimal: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const aiExample = ref<{ sentence: string, translation: string } | null>(null) // 用于存储 AI 例句和翻译
    const isLoadingExample = ref(false) // 用于指示例句加载状态

    const fetchAIExample = async () => {
      if (!props.wordData.word || !props.wordData.language) {
        console.error('单词或语言信息缺失，无法获取 AI 例句')
        return
      }

      isLoadingExample.value = true
      try {
        const example = await generateExampleSentence(props.wordData.language, props.wordData.word)
        aiExample.value = example
      }
      catch (error) {
        console.error('获取 AI 例句失败:', error)
        aiExample.value = { sentence: '无法获取 AI 例句，请稍后重试。', translation: '' }
      }
      finally {
        isLoadingExample.value = false
      }
    }

    // 在组件加载时，根据 minimal 的值决定是否获取 AI 例句
    onMounted(() => {
      if (!props.minimal) {
        fetchAIExample()
      }
    })

    // 监听 minimal 的变化，动态获取 AI 例句
    watch(
      () => props.minimal,
      (newVal) => {
        if (!newVal && !aiExample.value) {
          fetchAIExample()
        }
      },
    )

    return {
      aiExample,
      isLoadingExample,
    }
  },
})
</script>

<template>
  <scroll-view class="mt-6 box-border w-full flex-1 overflow-y-auto px-5" scroll-y>
    <!-- 如果处于 minimal 模式，只显示单词 -->
    <template v-if="minimal">
      <view class="h-full flex items-center justify-center">
        <text class="font-verdana text-4xl font-bold">
          {{ wordData.word }}
        </text>
      </view>
    </template>
    <!-- 非 minimal 模式：显示完整内容 -->
    <template v-else>
      <!-- 单词与发音 -->
      <view class="mb-1 flex flex-col">
        <text class="font-verdana text-3xl font-bold">
          {{ wordData.word }}
        </text>
        <text v-if="wordData.phonetics?.[0]?.ipa" class="mt-1 text-lg text-gray-500">
          [{{ wordData.phonetics[0].ipa }}]
        </text>
      </view>

      <!-- Tags -->
      <view v-if="wordData.tags && wordData.tags.length > 0" class="mb-3 mt-5 flex flex-wrap gap-1">
        <text
          v-for="(tag, idx) in wordData.tags"
          :key="idx"
          class="rounded bg-yellow px-2 py-1 text-xs font-bold"
        >
          {{ tag }}
        </text>
      </view>

      <!-- Part of Speech and Definitions -->
      <view v-for="(pos, posIndex) in wordData.partOfSpeechList" :key="`pos-${posIndex}`" class="mb-5">
        <!-- 词性 -->
        <view class="mb-2 mt-5 flex flex-wrap items-center gap-2">
          <text class="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700 font-semibold">
            {{ pos.type }}
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
      </view>

      <!-- 难度指示器 -->
      <view v-if="(wordData.difficulty ?? 0) > 0" class="mb-3 mt-5">
        <text class="mb-5 block text-left text-sm">
          难度:
        </text>
        <view class="mt-1 flex justify-start">
          <view
            v-for="n in 5"
            :key="n"
            class="mx-0.5 h-2 w-6 rounded first:ml-0" :class="[
              n <= (wordData.difficulty ?? 0) ? 'bg-yellow-500' : 'bg-gray-200',
            ]"
          />
        </view>
      </view>

      <view v-if="!aiExample" class="mt-4">
        <button
          class="rounded-full bg-blue-500 px-4 py-2 text-white"
          :disabled="isLoadingExample"
        >
          {{ isLoadingExample ? '加载中...' : '获取 AI 例句' }}
        </button>
      </view>

      <!-- 显示 AI 例句 -->
      <view v-if="aiExample" class="mt-4 rounded bg-blue-100/50 p-3">
        <text class="block text-base text-black font-medium">
          AI 例句:
        </text>
        <text class="mt-2 block text-sm text-black">
          {{ aiExample.sentence }}
        </text>
        <text v-if="aiExample.translation" class="mt-2 block text-sm text-gray-600">
          翻译: {{ aiExample.translation }}
        </text>
      </view>
    </template>
  </scroll-view>
</template>

<style scoped>
/* 可以添加额外样式 */
</style>
