<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'MyAvatar',

  setup() {
    // 用户信息状态
    const username = ref('用户名')
    const currentAvatarUrl = ref('/static/avatar/avatar.png')
    const isUploading = ref(false)

    // 返回逻辑
    const handleBack = () => {
      uni.navigateBack()
    }

    // 加载用户信息
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
            currentAvatarUrl.value = userData.avatarUrl
          }
          else {
            // 使用用户名首字母生成占位符头像
            const initial = (userData.username || 'U').charAt(0).toUpperCase()
            currentAvatarUrl.value = `https://placehold.co/150x150/007bff/ffffff?text=${initial}`
          }
        }
      }
      catch (error) {
        console.error('加载用户信息失败:', error)
      }
    }

    // 处理头像上传 - 修复版本
    const handleAvatarUpload = async (filePath: string) => {
      if (!username.value || username.value === '用户名') {
        uni.showToast({
          title: '用户信息不完整',
          icon: 'none',
        })
        return
      }

      try {
        isUploading.value = true

        // 显示上传进度
        uni.showLoading({
          title: '上传中...',
          mask: true,
        })

        // 获取token
        const token = uni.getStorageSync('token')

        // 修复：确保正确的请求格式
        const uploadResponse = await uni.uploadFile({
          url: `${API_BASE_URL}/account/UploadUserAvatar`,
          filePath,
          name: 'file', // 后端期望的文件字段名
          formData: {
            username: username.value, // 确保用户名正确传递
          },
          header: {
            // 添加认证头（如果后端需要）
            Authorization: `Bearer ${token}`,
            // 不要手动设置Content-Type，让uni.uploadFile自动处理
          },
        })

        // 处理响应
        if (uploadResponse.statusCode === 200) {
          let responseData
          try {
            responseData = JSON.parse(uploadResponse.data as string)
          }
          catch (parseError) {
            console.error('解析响应数据失败:', parseError)
            throw new Error('服务器响应格式错误')
          }

          // 检查后端返回的状态码
          if (responseData.code === 200) {
            uni.showToast({
              title: responseData.message || '头像更新成功',
              icon: 'success',
            })

            // 更新头像URL
            if (responseData.data && responseData.data.avatarUrl) {
              currentAvatarUrl.value = responseData.data.avatarUrl

              // 更新本地存储
              const userInfo = uni.getStorageSync('userInfo')
              if (userInfo) {
                userInfo.avatarUrl = responseData.data.avatarUrl
                uni.setStorageSync('userInfo', userInfo)
              }
            }

            // 重新加载用户信息
            await loadUserInfo()
          }
          else {
            throw new Error(responseData.message || responseData.msg || '上传失败')
          }
        }
        else {
          // 处理HTTP错误状态码
          let errorMessage = `上传失败，状态码: ${uploadResponse.statusCode}`

          try {
            const errorData = JSON.parse(uploadResponse.data as string)

            if (errorData.message) {
              errorMessage = errorData.message
            }
            else if (errorData.error) {
              errorMessage = errorData.error
            }
            else if (uploadResponse.statusCode === 400) {
              errorMessage = '请求参数错误：请检查文件格式和用户信息'
            }
          }
          catch (e) {
            console.error('解析错误响应数据失败:', e)
            if (uploadResponse.statusCode === 400) {
              errorMessage = '请求格式错误：请检查文件是否为有效的图片格式'
            }
          }

          throw new Error(errorMessage)
        }
      }
      catch (error) {
        console.error('头像上传失败:', error)

        let errorMessage = '头像上传失败'
        if (error instanceof Error) {
          errorMessage = error.message
        }

        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000,
        })
      }
      finally {
        isUploading.value = false
        uni.hideLoading()
      }
    }

    // 选择并上传头像 - 增强版本
    const uploadAvatar = () => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'], // 使用压缩后的图片
        sourceType: ['album', 'camera'],
        // 移除extension限制，因为某些平台可能不支持
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]

          if (!tempFilePath) {
            uni.showToast({
              title: '文件选择失败',
              icon: 'none',
            })
            return
          }

          // 可选：获取文件信息进行验证
          uni.getFileInfo({
            filePath: tempFilePath,
            success: (fileInfo) => {
              // 检查文件大小（5MB限制）
              const maxSize = 5 * 1024 * 1024 // 5MB
              if (fileInfo.size > maxSize) {
                uni.showToast({
                  title: '文件大小不能超过5MB',
                  icon: 'none',
                })
                return
              }

              handleAvatarUpload(tempFilePath)
            },
            fail: (err) => {
              console.warn('获取文件信息失败:', err)
              // 即使获取文件信息失败，也继续上传
              handleAvatarUpload(tempFilePath)
            },
          })
        },
        fail: (err) => {
          console.error('选择图片失败:', err)
          uni.showToast({
            title: '选择图片失败',
            icon: 'none',
          })
        },
      })
    }

    // 重置为默认头像
    const resetToDefaultAvatar = () => {
      uni.showModal({
        title: '确认重置',
        content: '确定要重置为默认头像吗？',
        success: (res) => {
          if (res.confirm) {
            const initial = username.value.charAt(0).toUpperCase()
            currentAvatarUrl.value = `https://placehold.co/150x150/007bff/ffffff?text=${initial}`

            // 更新本地存储
            const userInfo = uni.getStorageSync('userInfo')
            if (userInfo) {
              userInfo.avatarUrl = null
              uni.setStorageSync('userInfo', userInfo)
            }

            uni.showToast({
              title: '已重置为默认头像',
              icon: 'success',
            })
          }
        },
      })
    }

    onMounted(() => {
      loadUserInfo()
    })

    return {
      username,
      currentAvatarUrl,
      isUploading,
      handleBack,
      uploadAvatar,
      resetToDefaultAvatar,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <!-- Header -->
  <view class="relative z-10 flex flex-col items-center p-4">
    <view class="mt-12 flex flex-col items-center">
      <text class="mb-8 text-2xl font-bold">
        头像设置
      </text>

      <!-- 当前头像预览 -->
      <view class="relative mb-8">
        <image
          class="h-32 w-32 border-4 rounded-full"
          :src="currentAvatarUrl"
          alt="当前头像"
          @error="currentAvatarUrl = ''"
        />

        <!-- 上传中的遮罩 -->
        <view v-if="isUploading" class="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
          <text class="text-sm text-white">
            上传中...
          </text>
        </view>
      </view>

      <!-- 用户名显示 -->
      <text class="mb-8 text-lg">
        {{ username }}
      </text>
    </view>
  </view>

  <!-- 操作按钮区域 -->
  <view class="mx-4 space-y-4">
    <!-- 上传新头像按钮 -->
    <button
      class="w-full rounded-lg bg-yellow py-4 text-white font-bold"
      :disabled="isUploading"
      @click="uploadAvatar"
    >
      <view class="flex items-center justify-center">
        <view class="i-mynaui:camera mr-2 text-xl" />
        <text>{{ isUploading ? '上传中...' : '选择新头像' }}</text>
      </view>
    </button>

    <!-- 重置为默认头像按钮 -->
    <button
      class="w-full border rounded-lg bg-blue py-4 text-white font-bold"
      :disabled="isUploading"
      @click="resetToDefaultAvatar"
    >
      <view class="flex items-center justify-center">
        <view class="i-mynaui:refresh mr-2 text-xl" />
        <text>重置为默认头像</text>
      </view>
    </button>
  </view>

  <!-- 提示信息 -->
  <view class="mx-4 mt-8">
    <view class="rounded-lg bg-blue-50 p-4">
      <text class="text-sm text-blue-600">
        • 支持 JPG、PNG 格式图片
      </text>
      <text class="mt-1 block text-sm text-blue-600">
        • 建议图片尺寸为正方形，系统会自动裁剪
      </text>
      <text class="mt-1 block text-sm text-blue-600">
        • 图片大小不超过 5MB
      </text>
    </view>
  </view>
</template>

<style scoped>
/* UnoCSS handles most of the styling using utility classes */
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
