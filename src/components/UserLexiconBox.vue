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
  },
})
</script>

<template>
  <view class="mb-4 rounded-lg px-4 py-4 frosted-glass">
    <view class="flex cursor-pointer" @click="navigate">
      <!-- 左侧图片区域 -->
      <view class="mr-4 h-24 w-24 rounded-lg bg-gray-100">
        <image
          v-if="imageUrl"
          :src="imageUrl"
          class="h-full w-full rounded-lg object-cover"
        />
      </view>

      <!-- 右侧内容区域 -->
      <view class="flex flex-1 flex-col justify-between">
        <!-- 词书标题及状态 -->
        <view class="flex flex-col items-start">
          <view class="mb-2 inline-block rounded-full bg-yellow px-3 py-1">
            <text class="text-base text-white font-bold">
              {{ name }}
            </text>
          </view>

          <!-- 描述文本 -->
          <view class="mb-1 text-sm">
            {{ description }}
          </view>

          <!-- 创建信息 -->
          <view class="mb-1 flex items-center text-xs text-yellow">
            <view class="i-carbon:time mr-1" />
            <text>创建于: {{ formatDate(createTime) }}</text>
          </view>

          <!-- 词书标签 -->
          <view v-if="tags && tags.length" class="mt-1 flex flex-wrap gap-1">
            <view
              v-for="tag in tags"
              :key="tag"
              class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
            >
              {{ tag }}
            </view>
          </view>
        </view>

        <!-- 底部状态区域 -->
        <view class="mt-2 flex items-center justify-end">
          <!-- 公开/私有状态 -->
          <view
            class="mr-2 rounded-full px-2 py-0.5 text-xs"
            :class="isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
          >
            {{ isPublic ? '公开' : '私有' }}
          </view>

          <!-- 审核状态 -->
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
</template>

<style scoped>
</style>
