<!-- PostHeader.vue -->
<script lang="ts">
import { defineComponent } from 'vue'

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
  <view class="fixed left-4 top-4 z-50 h-12 w-12 flex cursor-pointer items-center justify-center rounded-full frosted-glass" @click="onBack">
    <view class="i-mynaui:arrow-left text-2xl" aria-label="返回" />
  </view>
</template>

<style scoped>
/* UnoCSS handles all styling using utility classes */
</style>
