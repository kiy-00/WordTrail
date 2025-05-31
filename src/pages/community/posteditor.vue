<!-- PostEditor.vue -->
<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { computed, defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'PostEditor',
  setup() {
    const images = ref<string[]>([])
    const title = ref('')
    const content = ref('')
    const username = ref('')
    const userAvatar = ref('')
    const userId = ref('')

    onMounted(() => {
      const userInfo = uni.getStorageSync('userInfo')
      userId.value = userInfo?.userId || userInfo?.id || ''
      username.value = userInfo?.username || uni.getStorageSync('username') || '匿名用户'
      userAvatar.value = uni.getStorageSync('userAvatar') || ''
      // eslint-disable-next-line no-console
      console.log('用户ID:', userId.value)
    })

    /**
     * 选择并上传图片
     */
    const chooseImages = () => {
      uni.chooseImage({
        count: 9, // 可根据需求调整最大选择数量
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          images.value.push(...res.tempFilePaths)
        },
        fail: () => {
          uni.showToast({
            title: '选择图片失败',
            icon: 'none',
          })
        },
      })
    }

    /**
     * 移除已上传的图片
     * @param index 图片索引
     */
    const removeImage = (index: number) => {
      images.value.splice(index, 1)
    }

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateBack()
    }
    const handleSuccess = () => {
      uni.hideLoading()
      uni.showToast({
        title: '发布成功',
        icon: 'success',
        success: () => {
          images.value = []
          title.value = ''
          content.value = ''

          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        },
      })
    }

    // 单文件上传
    const uploadSingleFile = async () => {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: `${API_BASE_URL}/forum/post/new`,
          filePath: images.value[0],
          name: 'files',
          formData: {
            userId: userId.value,
            title: title.value.trim(),
            content: content.value.trim(),
          },
          header: {
            Authorization: `Bearer ${uni.getStorageSync('token')}`,
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res)
            }
            else {
              reject(new Error(`上传失败，状态码: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            console.error('单文件上传失败:', err)
            reject(err)
          },
        })
      })
    }

    // 多文件上传 - 逐个上传但在后端统一处理
    const uploadMultipleFiles = async () => {
      const totalFiles = images.value.length
      const uploadPromises = []

      for (let i = 0; i < images.value.length; i++) {
        const uploadPromise = new Promise((resolve, reject) => {
          uni.uploadFile({
            url: `${API_BASE_URL}/forum/post/new`,
            filePath: images.value[i],
            name: 'files',
            formData: {
              userId: userId.value,
              title: title.value.trim(),
              content: content.value.trim(),
              fileIndex: i.toString(),
              totalFiles: totalFiles.toString(),
              isMultiFile: 'true',
            },
            header: {
              Authorization: `Bearer ${uni.getStorageSync('token')}`,
            },
            success: (res) => {
              // eslint-disable-next-line no-console
              console.log(`文件 ${i + 1}/${totalFiles} 上传成功:`, res)
              if (res.statusCode === 200) {
                resolve(res)
              }
              else {
                reject(new Error(`文件${i + 1}上传失败，状态码: ${res.statusCode}`))
              }
            },
            fail: (err) => {
              console.error(`文件${i + 1}上传失败:`, err)
              reject(err)
            },
          })
        })
        uploadPromises.push(uploadPromise)
      }

      // 等待所有文件上传完成
      await Promise.all(uploadPromises)
    }

    // 无图片上传
    const uploadWithoutImages = async () => {
      return new Promise((resolve, reject) => {
        uni.request({
          url: `${API_BASE_URL}/forum/post/new`,
          method: 'POST',
          data: {
            userId: userId.value,
            title: title.value.trim(),
            content: content.value.trim(),
          },
          header: {
            'Authorization': `Bearer ${uni.getStorageSync('token')}`,
            'Content-Type': 'application/json',
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res)
            }
            else {
              reject(new Error(`请求失败，状态码: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            reject(err)
          },
        })
      })
    }

    /**
     * 发布帖子
     */
    const publishPost = async () => {
      if (!title.value.trim()) {
        uni.showToast({ title: '标题不能为空', icon: 'none' })
        return
      }
      if (!content.value.trim()) {
        uni.showToast({ title: '正文不能为空', icon: 'none' })
        return
      }
      if (title.value.length < 3) {
        uni.showToast({ title: '标题不能少于3个字符', icon: 'none' })
        return
      }
      if (content.value.length < 10) {
        uni.showToast({ title: '正文不能少于10个字符', icon: 'none' })
        return
      }
      if (!userId.value) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      try {
        uni.showLoading({
          title: '发布中...',
          mask: true,
        })

        if (images.value.length > 0) {
          if (images.value.length === 1) {
            // 单文件上传，保持原逻辑
            await uploadSingleFile()
          }
          else {
            // 多文件上传，使用新的逐个上传逻辑
            await uploadMultipleFiles()
          }
          handleSuccess()
        }
        else {
          // 无图模式
          await uploadWithoutImages()
          handleSuccess()
        }
      }
      catch (error) {
        uni.hideLoading()
        uni.showToast({
          title: '发布失败，请稍后重试',
          icon: 'none',
        })
        console.error('发布帖子详细错误:', error)
      }
    }

    const justifyClass = computed(() => {
      return images.value.length >= 3 ? 'justify-between' : 'justify-start'
    })

    return {
      images,
      title,
      content,
      chooseImages,
      removeImage,
      publishPost,
      handleBack,
      justifyClass,
      username,
      userAvatar,
      userId,
    }
  },
})
</script>

<template>
  <!-- Back Button -->
  <BackButton @back="handleBack" />
  <view class="flex flex-col frosted-glass">
    <canvas canvas-id="avatarCanvas" style="width: 100px; height: 100px; position: absolute; left: -1000px;" />
    <view class="flex-1 p-4 space-y-4">
      <!-- Image Upload Section -->
      <view class="flex flex-col">
        <view class="flex flex-wrap gap-2" :class="[justifyClass]">
          <!-- Display Uploaded Images -->
          <view
            v-for="(image, index) in images"
            :key="index"
            class="relative w-23"
          >
            <image :src="image" class="h-23 w-23 rounded object-cover" />
            <view
              class="i-ci:close-sm absolute right-0 top-0 flex cursor-pointer items-center justify-center rounded-full bg-yellow"
              @click="removeImage(index)"
            />
          </view>
          <!-- Upload Button -->
          <view
            class="h-23 w-23 flex cursor-pointer items-center justify-center border-2 rounded border-dashed"
            @click="chooseImages"
          >
            <view class="i-mynaui:upload text-3xl" />
          </view>
        </view>
      </view>

      <!-- Title Input -->
      <view class="flex flex-col">
        <input
          v-model="title"
          type="text"
          placeholder="请输入标题 (最多18字)"
          :maxlength="18"
          class="rounded-lg border-dashed px-3 py-4 text-left"
        >
        <text class="mt-1 text-left text-sm">
          {{ title.length }}/18
        </text>
      </view>

      <!-- Content Editor -->
      <view class="flex flex-col">
        <textarea
          v-model="content"
          placeholder="请输入正文内容..."
          class="w-full resize-none overflow-y-auto border border-gray-300 rounded-lg px-3 py-2 text-left focus:border-yellow focus:outline-none"
          :maxlength="2000"
          rows="10"
          style="box-sizing: border-box; height: 200px; max-height: 200px; min-height: 200px;"
        />
        <text class="mt-1 text-left text-sm text-gray-500">
          {{ content.length }}/2000
        </text>
      </view>

      <!-- Publish Button -->
      <button
        class="w-full rounded-lg bg-yellow px-4 py-2 text-lg font-bold font-semibold"
        @click="publishPost"
      >
        发布帖子
      </button>
    </view>
  </view>
</template>

<style scoped>
/* 可根据需要添加额外样式 */
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
