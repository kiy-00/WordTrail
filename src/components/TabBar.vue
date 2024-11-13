<script setup lang="ts">
function navigateTo(page: string) {
  uni.navigateTo({
    url: page,
  })
}
</script>

<template>
  <view class="fixed bottom-0 left-0 right-0 flex justify-around bg-white py-3 shadow-md">
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
.fixed {
  position: fixed;
}
.bottom-0 {
  bottom: 0;
}
.left-0 {
  left: 0;
}
.right-0 {
  right: 0;
}
.flex {
  display: flex;
}
.justify-around {
  justify-content: space-around;
}
.bg-white {
  background-color: transparent;
}
.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.shadow-md {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.text-2xl {
  font-size: 1.5rem;
}
</style>
