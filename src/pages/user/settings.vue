<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

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

    const handleLogout = async () => {
      try {
        const token = uni.getStorageSync('token')
        const response = await uni.request({
          url: `/auth/logout`,
          method: 'DELETE',
          header: {
            Authorization: token,
          },
        })

        if (response.statusCode === 200) {
          // 清除本地存储的用户信息
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')

          uni.showToast({
            title: '已退出登录',
            icon: 'success',
          })

          // 跳转到登录页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/user/login',
            })
          }, 1500)
        }
        else {
          throw new Error('登出失败')
        }
      }
      catch (error) {
        console.error('登出失败:', error)
        uni.showToast({
          title: '登出失败',
          icon: 'none',
        })
      }
    }

    const clearLocalStorage = () => {
      uni.showModal({
        title: '确认清除',
        content: '这将清除所有本地数据并重新登录，确定继续吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除所有本地存储
            uni.clearStorageSync()

            uni.showToast({
              title: '清除成功',
              icon: 'success',
              duration: 1500,
            })

            // 延迟跳转到登录页
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/user/login',
              })
            }, 1500)
          }
        },
      })
    }

    // 添加用户名响应式引用
    const username = ref('')

    // 获取用户信息
    const loadUserInfo = () => {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo) {
        username.value = userInfo.username || '未知用户'
      }
    }

    onMounted(() => {
      loadUserInfo()
    })

    return {
      settingsItems,
      handleBack,
      handleLogout,
      clearLocalStorage,
      username,
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
        {{ username }}
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

  <!-- 在登出按钮上方添加清除缓存按钮 -->
  <view class="fixed bottom-24 left-0 right-0 mb-5 px-2">
    <button
      class="rounded-lg bg-yellow py-3 text-white font-bold"
      @click="clearLocalStorage"
    >
      清除缓存
    </button>
  </view>

  <!-- 登出按钮 -->
  <view class="fixed bottom-10 left-0 right-0 px-2">
    <button
      class="rounded-lg bg-yellow py-3 text-white font-bold"
      @click="handleLogout"
    >
      退出登录
    </button>
  </view>
</template>

<style scoped>
/* UnoCSS handles all styling using utility classes */
</style>
