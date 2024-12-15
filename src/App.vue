<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  setup() {
    const showSplash = ref(true)

    onMounted(() => {
      setTimeout(() => {
        showSplash.value = false
      }, 3000) // 启动画面显示3秒
    })

    return {
      showSplash,
    }
  },
})
</script>

<template>
  <view>
    <!-- 启动画面 -->
    <view v-if="showSplash" class="splash-screen">
      <image src="@/assets/splash.svg" class="h-full w-full" />
    </view>
    <!-- 应用内容 -->
    <view v-else>
      <!-- 在这里添加您的主要内容 -->
      <!-- ...existing code... -->
    </view>
  </view>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}
</style>
