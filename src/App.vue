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
    <view v-if="showSplash">
      <image src="/static/splash.svg" class="splash-image" />
    </view>
    <!-- 应用内容 -->
    <view v-else>
      <!-- ...existing code... -->
    </view>
  </view>
</template>

<style scoped>

</style>
