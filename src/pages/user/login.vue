<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'Login',
  setup() {
    const currentTab = ref<'login' | 'register'>('login') // 新增，记录当前选中的标签
    const loginMethod = ref<'email' | 'phone' | 'id'>('email') // 保持不变
    const account = ref<string>('') // 更新变量名为 account
    const password = ref<string>('')
    const confirmPassword = ref<string>('') // 新增，确认密码
    const agreePrivacy = ref<boolean>(false)
    const showPrivacyModal = ref<boolean>(false) // 新增，控制隐私协议弹框

    const handleAction = () => {
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
        if (currentTab.value === 'register' && password.value !== confirmPassword.value) {
          uni.showToast({
            title: '密码不一致',
            icon: 'none',
            mask: true,
          })
          return
        }
        if (currentTab.value === 'login') {
          uni.showToast({
            title: '登录成功',
            icon: 'success',
            mask: true,
          })
        }
        else {
          uni.showToast({
            title: '注册成功',
            icon: 'success',
            mask: true,
          })
        }
      }
      else {
        uni.showToast({
          title: '请先同意隐私协议',
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

    return {
      currentTab, // 新增
      loginMethod,
      account,
      password,
      confirmPassword, // 新增
      agreePrivacy,
      showPrivacyModal, // 新增
      openPrivacyModal, // 新增
      closePrivacyModal, // 新增
      handleAction, // 修改为通用方法
    }
  },
})
</script>

<template>
  <view class="p-5">
    <!-- 标签栏 -->
    <view class="mb-4 flex border-b">
      <button
        :class="{ 'text-blue-500 border-b-2 border-blue-500': currentTab === 'login' }"
        class="flex-1 py-2 text-center focus:outline-none"
        @click="currentTab = 'login'"
      >
        登录
      </button>
      <button
        :class="{ 'text-blue-500 border-b-2 border-blue-500': currentTab === 'register' }"
        class="flex-1 py-2 text-center focus:outline-none"
        @click="currentTab = 'register'"
      >
        注册
      </button>
    </view>

    <!-- 登录/注册表单 -->
    <view>
      <!-- 标签栏内的登录内容 -->
      <view v-if="currentTab === 'login'">
        <!-- 登录方式选择 -->
        <view class="mb-4 flex">
          <button :class="{ 'text-blue-500': loginMethod === 'email' }" class="flex-1" @click="loginMethod = 'email'">
            邮箱
          </button>
          <button :class="{ 'text-blue-500': loginMethod === 'phone' }" class="flex-1" @click="loginMethod = 'phone'">
            电话号码
          </button>
          <button :class="{ 'text-blue-500': loginMethod === 'id' }" class="flex-1" @click="loginMethod = 'id'">
            ID
          </button>
        </view>

        <!-- 共享账号输入框 -->
        <input
          v-if="loginMethod === 'email'"
          v-model="account"
          placeholder="请输入邮箱"
          class="mb-2 w-full border rounded p-2"
        >
        <input
          v-else-if="loginMethod === 'phone'"
          v-model="account"
          placeholder="请输入电话号码"
          class="mb-2 w-full border rounded p-2"
        >
        <input
          v-else
          v-model="account"
          placeholder="请输入ID"
          class="mb-2 w-full border rounded p-2"
        >

        <input
          v-model="password"
          placeholder="请输入密码"
          type="safe-password"
          class="mb-2 w-full border rounded p-2"
        >
      </view>

      <!-- 标签栏内的注册内容 -->
      <view v-else>
        <!-- 注册方式选择 -->
        <view class="mb-4 flex">
          <button :class="{ 'text-blue-500': loginMethod === 'email' }" class="flex-1" @click="loginMethod = 'email'">
            邮箱
          </button>
          <button :class="{ 'text-blue-500': loginMethod === 'phone' }" class="flex-1" @click="loginMethod = 'phone'">
            电话号码
          </button>
          <button :class="{ 'text-blue-500': loginMethod === 'id' }" class="flex-1" @click="loginMethod = 'id'">
            ID
          </button>
        </view>

        <!-- 共享账号输入框 -->
        <input
          v-if="loginMethod === 'email'"
          v-model="account"
          placeholder="请输入邮箱"
          class="mb-2 w-full border rounded p-2"
        >
        <input
          v-else-if="loginMethod === 'phone'"
          v-model="account"
          placeholder="请输入电话号码"
          class="mb-2 w-full border rounded p-2"
        >
        <input
          v-else
          v-model="account"
          placeholder="请输入ID"
          class="mb-2 w-full border rounded p-2"
        >

        <input
          v-model="password"
          placeholder="请输入密码"
          type="safe-password"
          class="mb-2 w-full border rounded p-2"
        >
        <input
          v-model="confirmPassword"
          placeholder="请再次输入密码"
          type="safe-password"
          class="mb-2 w-full border rounded p-2"
        >
      </view>

      <!-- 用户隐私协议 -->
      <view class="mt-2.5 flex flex-col">
        <checkbox-group>
          <label class="flex items-center space-x-2">
            <checkbox v-model="agreePrivacy" class="text-yellow" />
            <text>同意隐私协议</text>
            <button class="ml-2 text-blue-500" @click="openPrivacyModal">
              查看详情
            </button>
          </label>
        </checkbox-group>
      </view>

      <!-- 隐私协议弹框 -->
      <view v-if="showPrivacyModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <view class="w-3/4 rounded bg-white p-5">
          <text>这里是隐私协议的详细内容。</text>
          <button class="mt-4 w-full rounded bg-blue-500 p-2 text-white" @click="closePrivacyModal">
            我已知晓
          </button>
        </view>
      </view>

      <view class="mt-5">
        <button class="mt-2.5 w-full rounded bg-blue-500 p-2.5 text-white" @click="handleAction">
          {{ currentTab === 'login' ? '登录' : '注册' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
  /* 删除现有样式 */
</style>
