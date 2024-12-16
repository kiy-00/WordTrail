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
  },
  methods: {
    navigate() {
      if (this.url)
        uni.navigateTo({ url: this.url })
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
        <view class="flex flex-col items-start">
          <view class="mb-2 inline-block rounded-full bg-yellow px-3 py-1">
            <text class="text-base text-white font-bold">
              {{ name }}
            </text>
          </view>
          <view class="text-sm text-gray-600">
            {{ description }}
          </view>
          <view>
            {{ id }}
          </view>
        </view>

        <!-- 状态标签 -->
        <!--
        <view class="self-end">
          <view
            class="rounded-full px-3 py-1 text-xs"
            :class="getStatusClass(status)"
          >
            {{ getStatusText(status) }}
          </view>
        </view>
        -->
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
