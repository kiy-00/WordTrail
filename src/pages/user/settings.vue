<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'Settings',

  setup() {
    const settingsItems = ref([
      {
        key: 1,
        url: '/pages/user/myavatar', // 确保指向正确的头像设置页面
        icon: 'i-mynaui:image-circle',
        text: '外观设置',
        value: 'appearance',
      },
      {
        key: 2,
        url: '/pages/learn/learnsettings',
        icon: 'i-mynaui:config-vertical',
        text: '学习设置',
        value: 'learning',
      },
      {
        key: 3,
        url: '/pages/user/settings',
        icon: 'i-mynaui:tool',
        text: '更多设置',
        value: 'more',
      },
    ])

    // 添加用户信息状态
    const username = ref('')
    const avatarUrl = ref('')

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateBack()
    }

    const handleLogout = async () => {
      try {
        const token = uni.getStorageSync('token')

        if (!token) {
          // 如果没有token，直接清除本地数据并跳转
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')

          uni.showToast({
            title: '已退出登录',
            icon: 'success',
          })

          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/user/login',
            })
          }, 1500)
          return
        }

        // 显示加载提示
        uni.showLoading({
          title: '退出中...',
          mask: true,
        })

        try {
          // 调用正确的登出API
          const response = await uni.request({
            url: `${API_BASE_URL}/api/users/logout`,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          // eslint-disable-next-line no-console
          console.log('登出响应:', response)

          if (response.statusCode === 200) {
            // 登出成功
            uni.hideLoading()
            uni.showToast({
              title: '已退出登录',
              icon: 'success',
            })
          }
          else if (response.statusCode === 401) {
            // Token已失效，这是正常情况
            // eslint-disable-next-line no-console
            console.log('Token已失效，正常清除本地数据')
            uni.hideLoading()
            uni.showToast({
              title: '已退出登录',
              icon: 'success',
            })
          }
          else if (response.statusCode === 400) {
            // Token格式错误
            console.warn('Token格式错误，清除本地数据')
            uni.hideLoading()
            uni.showToast({
              title: '已退出登录',
              icon: 'success',
            })
          }
          else {
            // 其他HTTP错误
            throw new Error(`登出失败，状态码: ${response.statusCode}`)
          }
        }
        catch (apiError) {
          // API调用失败
          console.warn('登出API调用失败:', apiError)
          uni.hideLoading()

          // 即使API失败，也清除本地数据，确保用户能退出
          uni.showToast({
            title: '已退出登录',
            icon: 'success',
          })
        }

        // 无论API调用成功与否，都清除本地数据并跳转
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')

        // 跳转到登录页
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/user/login',
          })
        }, 1500)
      }
      catch (error) {
        console.error('登出过程出错:', error)
        uni.hideLoading()

        // 提供强制退出选项
        uni.showModal({
          title: '退出登录',
          content: '登出过程中出现问题，是否强制退出？',
          success: (res) => {
            if (res.confirm) {
              uni.removeStorageSync('token')
              uni.removeStorageSync('userInfo')

              uni.showToast({
                title: '已强制退出',
                icon: 'success',
              })

              setTimeout(() => {
                uni.reLaunch({
                  url: '/pages/user/login',
                })
              }, 1500)
            }
          },
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

    // 加载用户信息的函数
    const loadUserInfo = async () => {
      try {
        const userInfo = uni.getStorageSync('userInfo')

        if (!userInfo) {
          console.warn('未找到本地用户信息')
          return
        }

        // 获取用户ID
        const userId = userInfo.userId || userInfo.id

        if (!userId) {
          console.error('无法获取用户ID')
          return
        }

        // 调用API获取用户详细信息
        const token = uni.getStorageSync('token')
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/auth/user/${userId}`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200 && response.data) {
          const userData = response.data as any

          // 更新用户信息
          username.value = userData.username || '用户名'

          // 处理头像：如果API返回的头像为空，使用用户名首字母作为占位符
          if (userData.avatarUrl && userData.avatarUrl.trim() !== '') {
            avatarUrl.value = userData.avatarUrl
          }
          else {
            // 使用用户名首字母生成占位符头像
            const initial = (userData.username || 'U').charAt(0).toUpperCase()
            avatarUrl.value = `https://placehold.co/96x96/007bff/ffffff?text=${initial}`
          }
        }
        else {
          console.error('获取用户信息失败:', response)
          // 如果API调用失败，使用本地存储的信息作为备选
          username.value = userInfo.username || '用户名'
          if (userInfo.avatarUrl && userInfo.avatarUrl.trim() !== '') {
            avatarUrl.value = userInfo.avatarUrl
          }
          else {
            const initial = (userInfo.username || 'U').charAt(0).toUpperCase()
            avatarUrl.value = `https://placehold.co/96x96/007bff/ffffff?text=${initial}`
          }
        }
      }
      catch (error) {
        console.error('加载用户信息失败:', error)

        // 如果出错，尝试使用本地存储的信息
        try {
          const userInfo = uni.getStorageSync('userInfo')
          if (userInfo) {
            username.value = userInfo.username || '用户名'
            if (userInfo.avatarUrl && userInfo.avatarUrl.trim() !== '') {
              avatarUrl.value = userInfo.avatarUrl
            }
            else {
              const initial = (userInfo.username || 'U').charAt(0).toUpperCase()
              avatarUrl.value = `https://placehold.co/96x96/007bff/ffffff?text=${initial}`
            }
          }
        }
        catch (storageError) {
          console.error('读取本地用户信息失败:', storageError)
        }
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
      avatarUrl,
    }
  },

})
</script>

<template>
  <BackButton @back="handleBack" />

  <!-- Header -->
  <view class="relative z-10 flex flex-col items-center p-4">
    <view class="mt-12 flex flex-col items-center">
      <image
        class="h-24 w-24 rounded-full"
        :src="avatarUrl"
        alt="User Avatar"
        @error="avatarUrl = ''"
      />
      <text class="mt-2 text-2xl">
        {{ username }}
      </text>
    </view>
    <!-- <view class="absolute right-4 top-4 z-20 flex items-center">
      <view class="i-mynaui:envelope mr-1 text-lg" />

      <view class="absolute h-4 w-4 flex items-center justify-center rounded-full bg-red-500 -right-2 -top-1">
        <text class="text-xs font-bold">
          3
        </</view> -->
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
