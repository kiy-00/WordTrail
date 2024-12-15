<script setup lang="ts">
import { onMounted, ref } from 'vue'

const showSplash = ref(true)

onMounted(() => {
  setTimeout(() => {
    showSplash.value = false
  }, 3000)
})
</script>

<template>
  <view>
    <!-- 启动画面 -->
    <view v-if="showSplash" class="splash-screen">
      <image src="/static/splash.svg" class="splash-image" />
    </view>
    <!-- 应用内容 -->
    <view v-else>
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
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
}

.splash-image {
  width: 200rpx;
  height: 200rpx;
  object-fit: contain;
}
</style>
