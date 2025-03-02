<script setup lang="ts">
function navigateTo(page: string) {
  uni.navigateTo({
    url: page,
  })
}
</script>

<template>
  <view class="fixed bottom-0 left-0 right-0 flex justify-around py-3 shadow-md">
    <view cursor-pointer @click="navigateTo('/pages/community/community')">
      <view class="i-mynaui:aperture text-2xl" />
    </view>
    <view cursor-pointer @click="navigateTo('/pages/user/mycontent')">
      <view class="i-mynaui:academic-hat text-2xl" />
    </view>
    <view cursor-pointer @click="navigateTo('/pages/user/mydata')">
      <view class="i-mynaui:activity text-2xl" />
    </view>
  </view>
</template>

<style scoped>
</style>
