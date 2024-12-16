<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Settings',

  setup() {
    const settingsItems = ref([
      {
        key: 1,
        url: '/pages/user/mydata',
        icon: 'i-mynaui:image-circle',
        text: '外观设置',
        value: 'appearance',
      },
      // {
      //   key: 2,
      //   url: '/pages/user/mycontent',
      //   icon: 'i-mynaui:config-vertical',
      //   text: '学习设置',
      //   value: 'learning',
      // },
      // {
      //   key: 3,
      //   url: '/pages/user/settings',
      //   icon: 'i-mynaui:tool',
      //   text: '更多设置',
      //   value: 'more',
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
    }
  },

})
</script>

<template>
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

      <view class="absolute h-4 w-4 flex items-center justify-center rounded-full bg-red-500 -right-2 -top-1">
        <text class="text-xs font-bold">
          3
        </text>
      </view>
    </view> -->

    <!-- Links -->

    <view class="my-[15%] w-full flex flex-col rounded-md">
      <BoxItem
        v-for="(item, index) in settingsItems"
        :key="index"
        :url="item.url"
        :icon="item.icon"
        :text="item.text"
        :value="item.value"
      />
    </view>
  </view>
</template>

<style scoped>
/* UnoCSS handles all styling using utility classes */
</style>
