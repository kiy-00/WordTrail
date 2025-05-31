<script lang="ts">
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

      if (currentTab.value === 'login') {
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

        try {
          const response = await uni.request({
            url: '/api/v1/auth/login',
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
        // 注册逻辑 - 检查所有必填字段
        if (!account.value) {
          uni.showToast({
            title: '请输入用户名',
            icon: 'none',
            mask: true,
          })
          return
        }

        if (!email.value) {
          uni.showToast({
            title: '请输入邮箱',
            icon: 'none',
            mask: true,
          })
          return
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
        if (!emailRegex.test(email.value)) {
          uni.showToast({
            title: '请输入有效的邮箱地址',
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

        if (!confirmPassword.value) {
          uni.showToast({
            title: '请确认密码',
            icon: 'none',
            mask: true,
          })
          return
        }

        // 检查两次密码是否一致
        if (password.value !== confirmPassword.value) {
          uni.showToast({
            title: '两次密码输入不一致',
            icon: 'none',
            mask: true,
          })
          return
        }

        try {
          const response = await uni.request({
            url: `/api/v1/auth/register`,
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
            },
            data: {
              username: account.value,
              password: password.value,
              email: email.value,
            },
          })

          // 处理注册响应
          if (response.statusCode === 200 || response.statusCode === 201) {
            uni.showToast({
              title: '注册成功，请登录',
              icon: 'success',
              mask: true,
            })

            // 注册成功后切换到登录页
            currentTab.value = 'login'
            // 清空密码和确认密码，保留用户名便于登录
            password.value = ''
            confirmPassword.value = ''
          }
          else {
            // 处理错误响应
            let errorMsg = '注册失败'
            if (response.data && typeof response.data === 'object' && 'message' in response.data) {
              errorMsg = (response.data as any).message || errorMsg
            }

            uni.showToast({
              title: errorMsg,
              icon: 'none',
              mask: true,
            })
          }
        }
        catch (error) {
          console.error('注册发生错误:', error)
          uni.showToast({
            title: '网络请求错误',
            icon: 'none',
            mask: true,
          })
        }
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
          <!-- 用户名输入框 -->
          <input
            v-model="account"
            :placeholder="currentTab === 'login' ? '请输入用户名' : '请设置用户名'"
            class="mb-5 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
          >

          <!-- 邮箱输入框 - 只在注册时显示 -->
          <input
            v-if="currentTab === 'register'"
            v-model="email"
            placeholder="请输入邮箱"
            class="mb-5 border-2 border-yellow rounded border-dashed bg-transparent p-4 text-gray-600"
          >

          <!-- 密码输入框 -->
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
