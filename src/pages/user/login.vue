<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { defineComponent, ref } from 'vue'

// 严格匹配后端返回的登录响应格式
interface AuthLoginResponse {
  token: string
  userId: string
  username: string
}

export default defineComponent({
  name: 'Login',
  setup() {
    const currentTab = ref<'login' | 'register'>('login')
    const loginMethods = ['email', 'phone', 'id'] as const
    type LoginMethodType = typeof loginMethods[number]
    const loginMethod = ref<LoginMethodType>('email')
    const account = ref<string>('')
    const password = ref<string>('')
    const confirmPassword = ref<string>('')
    const email = ref<string>('')
    const verificationCode = ref<string>('')
    const sendingCode = ref<boolean>(false)
    const agreePrivacy = ref<boolean>(false)
    const showPrivacyModal = ref<boolean>(false)

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

      if (currentTab.value === 'login') {
        try {
          const response = await uni.request({
            url: `${API_BASE_URL}/api/v1/auth/login`,
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
            },
            data: {
              username: account.value,
              password: password.value,
            },
          })

          // 检查响应状态并处理数据
          if (response.statusCode === 200) {
            const responseData = response.data as AuthLoginResponse

            if (responseData.token) {
              // 保存token和用户信息，严格按照后端返回的字段
              uni.setStorageSync('token', responseData.token)
              uni.setStorageSync('userInfo', {
                userId: responseData.userId,
                username: responseData.username,
              })

              // 记录日志，便于调试
              // eslint-disable-next-line no-console
              console.log('登录成功，保存的信息:', responseData)

              uni.showToast({
                title: '登录成功',
                icon: 'success',
                mask: true,
              })

              // 登录成功后跳转
              uni.redirectTo({ url: '/pages/home/home' })
            }
            else {
              // token为空的处理
              uni.showToast({
                title: '登录失败，返回数据格式错误',
                icon: 'none',
                mask: true,
              })
            }
          }
          else {
            // 状态码不是200的处理
            uni.showToast({
              title: '登录失败，请检查用户名或密码',
              icon: 'none',
              mask: true,
            })
          }
        }
        catch (error) {
          console.error('登录发生错误:', error)
          uni.showToast({
            title: '网络请求错误',
            icon: 'none',
            mask: true,
          })
        }
      }
      else if (currentTab.value === 'register') {
        // 保留注册UI，但不实现功能
        uni.showToast({
          title: '注册功能暂未开放',
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
      console.log('隐私协议状态:', agreePrivacy.value)
    }

    // 发送验证码的函数（仅保留UI交互，不实际调用API）
    const sendVerificationCode = async () => {
      if (!email.value) {
        uni.showToast({
          title: '请输入邮箱',
          icon: 'none',
          mask: true,
        })
        return
      }

      // 模拟发送验证码
      sendingCode.value = true
      setTimeout(() => {
        sendingCode.value = false
        uni.showToast({
          title: '验证码功能暂未开放',
          icon: 'none',
          mask: true,
        })
      }, 1000)
    }

    return {
      currentTab,
      loginMethod,
      loginMethods,
      account,
      password,
      confirmPassword,
      agreePrivacy,
      showPrivacyModal,
      openPrivacyModal,
      closePrivacyModal,
      handleAction,
      handlePrivacyChange,
      email,
      verificationCode,
      sendingCode,
      sendVerificationCode,
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

        <!-- 输入框容器使用统一的宽度和对齐方式 -->
        <view class="w-full space-y-3">
          <input
            v-model="account"
            :placeholder="loginMethod === 'email' ? '请输入用户名' : loginMethod === 'phone' ? '请输入电话号码' : '请输入ID'"
            class="mb-5 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
          >

          <!-- 新增邮箱输入框 -->
          <input
            v-if="currentTab === 'register'"
            v-model="email"
            placeholder="请输入邮箱"
            class="mb-5 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
          >

          <!-- 新增验证码输入框和发送按钮 -->
          <view v-if="currentTab === 'register'" class="flex items-center space-x-2">
            <input
              v-model="verificationCode"
              placeholder="请输入验证码"
              class="flex-1 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
            >
            <button
              :disabled="sendingCode"
              class="rounded bg-yellow px-4 py-2 text-white transition-colors disabled:bg-gray-400 hover:bg-yellow-600"
              @click="sendVerificationCode"
            >
              {{ sendingCode ? '发送中...' : '发送验证码' }}
            </button>
          </view>

          <input
            v-model="password"
            placeholder="请输入密码"
            :password="true"
            class="mb-5 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
          >

          <!-- 注册时的确认密码框 -->
          <input
            v-if="currentTab === 'register'"
            v-model="confirmPassword"
            placeholder="请再次输入密码"
            :password="true"
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
