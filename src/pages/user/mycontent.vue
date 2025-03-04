<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MyContent',

  setup() {
    const bookLearned = ref(0)
    const recentlyLearned = ref(0)
    const totalLearned = ref(0)
    const vocabularyCount = ref(0)
    const notes = ref(0)

    // 定义设置项数组
    const settingsItems = ref([
      {
        url: '/pages/user/mylexicon',
        icon: 'i-mynaui:book-open',
        text: '在学词书',
        value: bookLearned,
      },
      {
        url: '/pages/user/recentlylearned',
        icon: 'i-mynaui:clock-circle',
        text: '最近学习',
        value: recentlyLearned,
      },
      {
        url: '/pages/user/totallearned',
        icon: 'i-mynaui:chart-bar',
        text: '总学习量',
        value: totalLearned,
      },
      // {
      //   url: '/pages/user/vocabularycount',
      //   icon: 'i-mynaui:book',
      //   text: '词汇量',
      //   value: vocabularyCount,
      // },
      // {
      //   url: '/pages/user/notes',
      //   icon: 'i-mynaui:pen',
      //   text: '笔记',
      //   value: notes,
      // },
    ])

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateBack()
    }

    return {
      settingsItems,
      handleBack,
      bookLearned,
      recentlyLearned,
      totalLearned,
      vocabularyCount,
      notes,
    }
  },
})
</script>

<template>
  <!-- Back Button -->
  <BackButton @back="handleBack" />

  <!-- Header -->
  <view class="relative z-10 flex flex-col items-center p-4">
    <view class="mt-12 flex flex-col items-center">
      <image class="h-24 w-24 rounded-full" src="@/static/avatar/avatar.png" alt="User Avatar" />
      <text class="mt-2 text-2xl">
        username
      </text>
    </view>
    <!-- <view class="absolute right-4 top-4 z-20 flex items-center">
      <view class="i-mynaui:envelope mr-1 text-lg" />

      <view class="absolute left-4 top--1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500">
        <text class="text-xs font-bold">
          3
        </text>
      </view>
    </view> -->
  </view>

  <!-- Links -->
  <view class="my-[15%] flex flex-col rounded-md">
    <!-- 使用 v-for 循环渲染 BoxItem -->
    <BoxItem
      v-for="(item, index) in settingsItems"
      :key="index"
      :url="item.url"
      :icon="item.icon"
      :text="item.text"
      :value="item.value"
    />
  </view>
</template>

<style scoped>
/* UnoCSS 处理所有样式使用实用类 */
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
