<template>
  <view class="relative min-h-screen px-5 py-10 text-center" style="box-sizing:border-box">
    <!-- 背景图片 -->
    <view class="absolute inset-0 bgi-[user-bg-image]">
      <!-- 毛玻璃遮罩 -->
      <view class="absolute inset-0 bg-white bg-opacity-5 backdrop-blur-sm" />
    </view>
    <view class="relative z-10">
      <slot />
    </view>
  </view>
</template>
