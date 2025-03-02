<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'UserLexiconBox',
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
      default: 0,
    },
    createTime: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      default: 'approved',
    },
    tags: {
      type: Array as () => string[],
      default: () => [],
    },
    createUser: {
      type: String,
      default: '',
    },
  },
  methods: {
    navigate() {
      if (this.url)
        uni.navigateTo({ url: this.url })
    },
    formatDate(dateString: string) {
      try {
        const date = new Date(dateString)
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
      }
      catch (e) {
        console.error(e)
        return '未知日期'
      }
    },
    truncateText(text: string, length: number): string {
      return text.length > length ? `${text.substring(0, length)}...` : text
    },
    viewDetail() {
      uni.navigateTo({
        url: `/pages/lexicon/userlexicondetail?id=${this.id}&type=user`,
      })
    },
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

          <!-- 描述文本 -->
          <view class="mb-1 text-sm">
            {{ truncateText(description, 20) }}
          </view>

          <!-- 创建信息 -->
          <view class="mb-1 flex items-center text-xs text-yellow">
            <view class="i-carbon:time mr-1" />
            <text>创建于: {{ formatDate(createTime) }}</text>
          </view>
        </view>

        <!-- 底部状态标签 -->
        <view class="flex flex-col items-end">
          <!-- 标签显示 -->
          <view v-if="tags && tags.length" class="mb-2 flex flex-wrap justify-end gap-1">
            <view
              v-for="tag in tags"
              :key="tag"
              class="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
            >
              {{ tag }}
            </view>
          </view>

          <!-- 状态标签 -->
          <view class="flex items-center">
            <view
              class="mr-2 rounded-full px-2 py-0.5 text-xs"
              :class="isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
            >
              {{ isPublic ? '公开' : '私有' }}
            </view>

            <view
              class="rounded-full px-2 py-0.5 text-xs"
              :class="{
                'bg-green-100 text-green-700': status === 'approved',
                'bg-yellow-100 text-yellow-700': status === 'pending',
                'bg-red-100 text-red-700': status === 'rejected',
              }"
            >
              {{ status === 'approved' ? '已审核' : status === 'pending' ? '审核中' : '已拒绝' }}
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
</style>
