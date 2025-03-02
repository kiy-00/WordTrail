<script lang="ts">
import { defineComponent } from 'vue'

export type LexiconStatus = 'learning' | 'completed' | 'not-started'

export default defineComponent({
  name: 'LexiconBox',
  props: {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // status: {
    //   type: String as () => LexiconStatus,
    //   required: true,
    //   validator: (value: string) => ['learning', 'completed', 'not-started'].includes(value),
    // },
    imageUrl: {
      type: String,
      default: '/src/static/lexicon.png',
    },
    url: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      required: true,
    },
  },
  methods: {
    navigate() {
      if (this.url)
        uni.navigateTo({ url: this.url })
    },
    truncateText(text: string, length: number): string {
      return text.length > length ? `${text.substring(0, length)}...` : text
    },
    viewDetail() {
      uni.navigateTo({
        url: `/pages/lexicon/lexicondetail?id=${this.id}&type=system`,
      })
    },
    // getStatusText(status: LexiconStatus) {
    //   const statusMap = {
    //     'learning': '学习中',
    //     'completed': '已完成',
    //     'not-started': '未开始',
    //   }
    //   return statusMap[status]
    // },
    // getStatusClass(status: LexiconStatus) {
    //   const statusClassMap = {
    //     'learning': 'bg-yellow text-white',
    //     'completed': 'bg-green-500 text-white',
    //     'not-started': 'bg-gray-200 text-gray-600',
    //   }
    //   return statusClassMap[status]
    // },
  },
})
</script>

<template>
  <view class="mb-4 rounded-lg px-4 py-4 frosted-glass">
    <view class="flex">
      <!-- 左侧区域：图片和详情按钮 -->
      <view class="mr-4 flex flex-col justify-between">
        <!-- 图片区域 -->
        <view class="h-24 w-24 rounded-lg bg-gray-100">
          <image
            v-if="imageUrl"
            :src="imageUrl"
            class="h-full w-full rounded-lg object-cover"
          />
        </view>

        <!-- 查看详情按钮 -->
        <button
          class="mt-2 w-full rounded bg-blue px-2 py-1 text-xs text-white"
          @click.stop="viewDetail"
        >
          查看详细
        </button>
      </view>

      <!-- 右侧内容区域 -->
      <view class="flex flex-1 flex-col cursor-pointer justify-between" @click="navigate">
        <!-- 词书标题及描述 -->
        <view class="flex flex-col items-start">
          <view class="mb-2 inline-block rounded-full bg-yellow px-3 py-1">
            <text class="text-base text-white font-bold">
              {{ truncateText(name, 14) }}
            </text>
          </view>
          <view class="text-sm">
            {{ truncateText(description, 20) }}
          </view>
        </view>

        <!-- 右下角可添加其他信息 -->
        <view class="self-end">
          <text v-if="wordCount > 0" class="text-xs text-gray-500">
            包含 {{ wordCount }} 个单词
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
</style>
