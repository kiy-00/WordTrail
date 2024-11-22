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

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateBack()
    }

    return {
      bookLearned,
      recentlyLearned,
      totalLearned,
      vocabularyCount,
      notes,
      handleBack,
    }
  },
})
</script>

<template>
  <view class="relative min-h-screen flex flex-col bg-blue-900">
    <!-- Back Button -->
    <BackButton @back="handleBack" />

    <!-- Content -->
    <view class="flex-1 p-4 space-y-4">
      <view class="profile-page">
        <view class="header">
          <view class="help">
            <view class="i-mynaui:info-octagon absolute right-2 top-2 text-2xl" />
          </view>
        </view>
        <view class="links">
          <BoxItem
            url="/pages/user/mycontent"
            icon="i-mynaui:book-open"
            text="在学词书"
            :value="bookLearned"
          />
          <BoxItem
            url="/pages/user/recentlylearned"
            icon="i-mynaui:clock"
            text="最近学习"
            :value="recentlyLearned"
          />
          <BoxItem
            url="/pages/user/totallearned"
            icon="i-mynaui:chart-bar"
            text="总学习量"
            :value="totalLearned"
          />
          <BoxItem
            url="/pages/user/vocabularycount"
            icon="i-mynaui:book"
            text="词汇量"
            :value="vocabularyCount"
          />
          <BoxItem
            url="/pages/user/notes"
            icon="i-mynaui:note"
            text="笔记"
            :value="notes"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* UnoCSS handles all styling using utility classes */
</style>
