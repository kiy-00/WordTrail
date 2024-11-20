<!-- PostHeader.vue -->
<script lang="ts">
export default defineComponent({
  name: 'BackButton',
  emits: {
    back: () => true,

  },
  setup(_, { emit }) {
    const onBack = () => {
      emit('back')
    }

    return {
      onBack,
    }
  },
})
</script>

<template>
  <view class="fixed left-0 right-0 top-0 z-50 h-12 flex items-center justify-between border-b border-gray-300 bg-white px-4">
    <!-- 左侧返回按钮 -->
    <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="onBack">
      <view class="i-mynaui:arrow-left text-2xl text-gray-500" aria-label="返回" />
    </view>
  </view>
</template>

<style scoped>
/* UnoCSS handles all styling using utility classes */
</style>
