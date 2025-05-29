<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'MyContent',

  setup() {
    const bookLearned = ref(0)
    const recentlyLearned = ref(0)
    const totalLearned = ref(0)
    const vocabularyCount = ref(0)
    const notes = ref(0)

    // 添加用户信息状态
    const username = ref('用户名')
    const avatarUrl = ref('/static/avatar/avatar.png')

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

    // 在组件挂载时加载用户信息
    onMounted(() => {
      loadUserInfo()
    })

    // 定义设置项数组
    const settingsItems = ref([
      {
        url: '/pages/user/mylexicon',
        icon: 'i-mynaui:book-open',
        text: '在学词书',
        value: bookLearned,
      },
      {
        url: '/pages/user/selectlexicon',
        icon: 'i-mynaui:arrow-left-right',
        text: '换本词书',
        value: recentlyLearned,
      },
      {
        url: '/pages/user/totallearned',
        icon: 'i-mynaui:chart-bar',
        text: '总学习量',
        value: totalLearned,
      },
      {
        url: '/pages/user/myuserlexicon',
        icon: 'i-mynaui:book',
        text: '我的词书',
        value: vocabularyCount,
      },
      // {
      //   url: '/pages/user/notes',
      //   icon: 'i-mynaui:pen',
      //   text: '笔记',
      //   value: notes,
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
      bookLearned,
      recentlyLearned,
      totalLearned,
      vocabularyCount,
      notes,
      username,
      avatarUrl,
    }
  },
})
</script>

<template>
  <!-- Back Button -->
  <BackButton @back="handleBack" />

  <!-- Header -->
  <view class="relative z-10 flex flex-col items-center p-4">
    <view class="mt-12 flex flex-col items-center">
      <image
        class="h-24 w-24 rounded-full"
        :src="avatarUrl"
        alt="User Avatar"
        @error="avatarUrl = '/static/avatar/avatar.png'"
      />
      <text class="mt-2 text-2xl">
        {{ username }}
      </text>
    </view>
    <!-- <view class="absolute right-4 top-4 z-20 flex items-center">
      <view class="i-mynaui:envelope mr-1 text-lg" />

      <view class="absolute left-4 top--1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500">
        <text class="text-xs font-bold">
          3
        </text>
      </view>
    </view> -->
  </view>

  <!-- Links -->
  <view class="my-[15%] flex flex-col rounded-md">
    <!-- 使用 v-for 循环渲染 BoxItem -->
    <BoxItem
      v-for="(item, index) in settingsItems"
      :key="index"
      :url="item.url"
      :icon="item.icon"
      :text="item.text"
      :value="item.value"
    />
  </view>
</template>

<style scoped>
/* UnoCSS 处理所有样式使用实用类 */
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
