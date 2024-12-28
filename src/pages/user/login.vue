<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { defineComponent, ref } from 'vue'

interface LoginResponse {
  message: string
  token: string
  user: {
    id: string
    username: string
    email: string
  }
}

interface RegisterResponse {
  message: string
  user: {
    username: string
    email: string
    id: number
    created_at: string
  }
}

interface FailedResponse {
  error: string
}

export default defineComponent({
  name: 'Login',
  setup() {
    const currentTab = ref<'login' | 'register'>('login') // 新增，记录当前选中的标签
    const loginMethods = ['email', 'phone', 'id'] as const
    type LoginMethodType = typeof loginMethods[number]
    const loginMethod = ref<LoginMethodType>('email') // 保持不变
    const account = ref<string>('') // 更新变量名为 account
    const password = ref<string>('')
    const confirmPassword = ref<string>('') // 新增，确认密码
    const agreePrivacy = ref<boolean>(false)
    const showPrivacyModal = ref<boolean>(false) // 新增，控制隐私协议弹框

    const handleAction = async () => {
      // 首先检查隐私协议
      if (!agreePrivacy.value) {
        uni.showToast({
          title: '请先同意隐私协议',
          icon: 'none',
          mask: true,
        })
        return
      }

      // 检查必填字段
      if (!account.value) {
        uni.showToast({
          title: '请输入账号',
          icon: 'none',
          mask: true,
        })
        return
      }
      if (!password.value) {
        uni.showToast({
          title: '请输入密码',
          icon: 'none',
          mask: true,
        })
        return
      }
      if (currentTab.value === 'register' && !confirmPassword.value) {
        uni.showToast({
          title: '请再次输入密码',
          icon: 'none',
          mask: true,
        })
        return
      }

      if (agreePrivacy.value) {
        // eslint-disable-next-line no-console
        console.log('agreePrivacy:', agreePrivacy.value)
        if (currentTab.value === 'register' && password.value !== confirmPassword.value) {
          uni.showToast({
            title: '密码不一致',
            icon: 'none',
            mask: true,
          })
          return
        }
      }
      else {
        // eslint-disable-next-line no-console
        console.log('agreePrivacy:', agreePrivacy.value)
        uni.showToast({
          title: '请先同意隐私协议',
          icon: 'none',
          mask: true,
        })
      }

      try {
        if (currentTab.value === 'login') {
          const response = await uni.request({
            url: `${API_BASE_URL}/auth/login`,
            method: 'POST',
            header: {
              'content-type': 'application/json',
              'Access-Control-Allow-Origin': '*', // 如果后端允许的话
            },
            data: {
              code: 'test',
              password: password.value,
              username: account.value,
              uuid: 'test',

            },
          })

          if (response.statusCode === 200) {
            const data = response.data as LoginResponse
            // eslint-disable-next-line no-console
            console.log('登录后端响应数据:', response.data)

            // 先存储数据
            uni.setStorageSync('token', data.token) // 改用统一的 token key
            uni.setStorageSync('userInfo', {
              userId: data.user.id, // 统一字段名
              username: data.user.username,
              email: data.user.email,
              phone: null,
              avatarUrl: null,
              status: 0,
              createTime: new Date().toISOString(),
              updateTime: new Date().toISOString(),
            })

            // 验证存储是否成功
            const storedToken = uni.getStorageSync('token')
            const storedUser = uni.getStorageSync('userInfo')

            // eslint-disable-next-line no-console
            console.log('存储后的Token:', storedToken)
            // eslint-disable-next-line no-console
            console.log('存储后的用户信息:', storedUser)

            if (storedToken && storedUser) {
              uni.showToast({
                title: '登录成功',
                icon: 'success',
                mask: true,
              })

              uni.redirectTo({ url: '/pages/home/home' }) // 跳转到首页
              // eslint-disable-next-line no-console
              console.log('登录后端响应数据:', data) // 日志记录 uni.redirectTo({ url: '/pages/home/home' }) // 跳转到首页
            }
            else {
              uni.showToast({
                title: '登录信息存储失败',
                icon: 'none',
                mask: true,
              })
            }
          }
          else {
            const data = response.data as FailedResponse
            uni.showToast({
              title: data.error,
              icon: 'none',
              mask: true,
            })
          }
        }
        else if (currentTab.value === 'register') {
          // 注册逻辑
          const response = await uni.request({
            url: `${API_BASE_URL}/auth/register`,
            method: 'POST',
            data: {
              username: account.value,
              password: password.value,
              email: account.value,
            },
          })

          // eslint-disable-next-line no-console
          console.log('注册后端响应数据:', response.data) // 日志记录

          if (response.statusCode === 201) {
            const data = response.data as RegisterResponse
            uni.showToast({
              title: data.message,
              icon: 'success',
              mask: true,
            })

            setTimeout(() => {
              uni.redirectTo({ url: '/pages/user/login' })
            }, 100)
          }
          else {
            const data = response.data as FailedResponse
            uni.showToast({
              title: data.error,
              icon: 'none',
              mask: true,
            })
          }
        }
      }
      catch (error) {
        console.error('Request failed:', error) // 打印错误信息用于调试
        uni.showToast({
          title: '网络问题，请稍后重试',
          icon: 'none',
          mask: true,
        })
      }
    }

    const openPrivacyModal = () => {
      showPrivacyModal.value = true
    }

    const closePrivacyModal = () => {
      showPrivacyModal.value = false
    }

    const handlePrivacyChange = (e: { detail: { value: string[] } }) => {
      agreePrivacy.value = e.detail.value.length > 0
      // eslint-disable-next-line no-console
      console.log('隐私协议状态:', agreePrivacy.value) // 添加日志便于调试
    }

    return {
      currentTab, // 新增
      loginMethod,
      loginMethods,
      account,
      password,
      confirmPassword, // 新增
      agreePrivacy,
      showPrivacyModal, // 新增
      openPrivacyModal, // 新增
      closePrivacyModal, // 新增
      handleAction, // 修改为通用方法
      handlePrivacyChange,
    }
  },
})
</script>

<template>
  <!-- 应用 Logo 和标题 -->
  <view class="mt-10 flex flex-col items-center justify-center bg-white">
    <image src="/static/logo.svg" class="mb-4 mt-5 h-32 w-32" />
    <text class="mb-8 text-3xl text-yellow font-bold">
      WordTrail
    </text>

    <!-- 登录/注册表单容器 -->
    <view class="max-w-md w-full rounded-lg">
      <view class="px-8 py-5">
        <!-- 修改 padding 确保内容对齐 -->
        <!-- 标签栏 - 仿照 CommunityHeader 样式 -->
        <view class="mb-4 flex justify-center border-b border-gray-200">
          <view
            class="relative mx-2 cursor-pointer text-base"
            :class="currentTab === 'login' ? 'text-yellow font-bold' : 'text-gray-600'"
            @click="currentTab = 'login'"
          >
            登录
            <view
              v-if="currentTab === 'login'"
              class="absolute bottom-[-1px] left-1/2 h-0.5 w-5 transform bg-yellow -translate-x-1/2"
            />
          </view>
          <view
            class="relative mx-2 cursor-pointer text-base"
            :class="currentTab === 'register' ? 'text-yellow font-bold' : 'text-gray-600'"
            @click="currentTab = 'register'"
          >
            注册
            <view
              v-if="currentTab === 'register'"
              class="absolute bottom-[-1px] left-1/2 h-0.5 w-5 transform bg-yellow -translate-x-1/2"
            />
          </view>
        </view>

        <!-- 登录方式选择按钮 - 使用黄色背景 -->
        <!-- <view class="mb-4 flex space-x-2">
          <button
            v-for="method in loginMethods"
            :key="method"
            class="flex-1 rounded-full px-2 py-2 text-center"
            :class="loginMethod === method ? 'bg-yellow text-white' : 'bg-purple-200 text-gray-600'"
            @click="loginMethod = method"
          >
            {{ method === 'email' ? '邮箱' : method === 'phone' ? '电话号码' : 'ID' }}
          </button>
        </view> -->

        <!-- 输入框容器使用统一的宽度和对齐方式 -->
        <view class="w-full space-y-3">
          <input
            v-model="account"
            :placeholder="loginMethod === 'email' ? '请输入用户名' : loginMethod === 'phone' ? '请输入电话号码' : '请输入ID'"
            class="mb-5 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
          >

          <input
            v-model="password"
            placeholder="请输入密码"
            type="safe-password"
            class="mb-5 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
          >

          <!-- 注册时的确认密码框 -->
          <input
            v-if="currentTab === 'register'"
            v-model="confirmPassword"
            placeholder="请再次输入密码"
            type="safe-password"
            class="mb-5 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
          >
        </view>

        <!-- 用户隐私协议 - 调整布局 -->
        <view class="mt-5 flex items-center justify-center space-x-2">
          <checkbox-group @change="handlePrivacyChange">
            <checkbox
              value="1"
              :class="{ 'text-yellow': agreePrivacy }"
            />
          </checkbox-group>
          <text :class="{ 'text-yellow': agreePrivacy, 'text-gray-600': !agreePrivacy }">
            同意隐私协议
          </text>
          <button class="ml-2 rounded-full bg-yellow px-3 py-1 text-sm text-white transition-colors hover:bg-yellow-600" @click="openPrivacyModal">
            查看详情
          </button>
        </view>

        <!-- 隐私协议弹框 -->
        <view v-if="showPrivacyModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <view class="w-3/4 rounded bg-white p-5">
            <text class="text-gray-600">
              本app目前不已盈利为目的，希望能为广大小语种学习者创造一个良好的学习环境，我们的进步需要您的支持！词库数据来源于网络，如有侵权请告知
            </text>
            <button class="mt-4 w-full rounded-lg bg-purple p-2 text-white" @click="closePrivacyModal">
              我已知晓
            </button>
          </view>
        </view>

        <!-- 提交按钮改为黄色背景 -->
        <view class="mt-10">
          <button
            class="mt-2.5 w-full rounded-full bg-yellow py-3 text-white font-bold transition-colors hover:bg-purple-300"
            @click="handleAction"
          >
            {{ currentTab === 'login' ? '登录' : '注册' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 可以删除之前的样式，使用 Tailwind 类名控制 */
</style>

<route lang="json">
  {
    "layout": "login"
  }
</route>
