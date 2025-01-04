<!-- PostEditor.vue -->
<script lang="ts">
import type { Post } from '@/types/Post'
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'PostEditor',
  setup() {
    const images = ref<string[]>([])
    const title = ref('')
    const content = ref('')
    const availableTags = ref(['技术', '生活', '娱乐', '其他'])
    const selectedTags = ref<string[]>([])

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

    const updateSelectedTags = (event: Event) => {
      const target = event.target as HTMLInputElement
      if (target.checked) {
        selectedTags.value.push(target.value)
      }
      else {
        selectedTags.value = selectedTags.value.filter(tag => tag !== target.value)
      }
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

      const newPost: Post = {
        id: Date.now(),
        title: title.value.trim(),
        content: content.value.trim(),
        publishTime: new Date().toISOString(),
        username: '当前用户名', // 替换为实际用户名
        userAvatar: 'https://via.placeholder.com/40', // 替换为实际头像
        images: images.value,
        tags: selectedTags.value,
        likes: 0,
        collects: 0,
      }

      // 防报错语句
      newPost.collects = 0 // 初始化收藏数为 0

      try {
        if (images.value.length > 0) {
          for (const filePath of images.value) {
            const uploadRes = await new Promise<UniApp.UploadFileSuccessCallbackResult>((resolve, reject) => {
              uni.uploadFile({
                url: '/forum/post/new',
                filePath,
                name: 'files',
                header: {
                  Authorization: uni.getStorageSync('token'),
                },
                formData: {
                  title: title.value.trim(),
                  content: content.value.trim(),
                },
                success: res => resolve(res),
                fail: err => reject(err),
              })
            })
            // 简单使用 uploadRes，避免未使用变量的警告
            if (uploadRes.statusCode !== 200) {
              throw new Error('上传失败')
            }
          }
          uni.showToast({ title: '已发布', icon: 'success' })
          // 重置表单
          images.value = []
          title.value = ''
          content.value = ''
          selectedTags.value = []
        }
        else {
          // 无图片时保持原先 JSON 请求
          const [reqErr, reqRes] = await uni.request({
            url: '/forum/post/new',
            method: 'POST',
            header: {
              Authorization: uni.getStorageSync('token'),
            },
            data: {
              title: title.value.trim(),
              content: content.value.trim(),
            },
          }) as unknown as [any, { data: any }]

          if (reqErr) {
            throw reqErr
          }
          if (reqRes.data.code === 200) {
            uni.showToast({ title: '已发布', icon: 'success' })
            // 重置表单
            images.value = []
            title.value = ''
            content.value = ''
            selectedTags.value = []
          }
          else {
            uni.showToast({ title: reqRes.data.msg || '发布失败', icon: 'none' })
          }
        }
      }
      catch (error) {
        uni.showToast({ title: '发布失败', icon: 'none' })
        console.error('发布失败:', error)
      }
    }

    // 计算 justify-content 的类
    const justifyClass = computed(() => {
      return images.value.length >= 3 ? 'justify-between' : 'justify-start'
    })

    return {
      images,
      title,
      content,
      availableTags,
      selectedTags,
      chooseImages,
      removeImage,
      publishPost,
      handleBack,
      updateSelectedTags,
      justifyClass, // 返回计算属性
    }
  },
})
</script>

<template>
  <!-- Back Button -->
  <BackButton @back="handleBack" />
  <view class="flex flex-col frosted-glass">
    <!-- Editor Content -->
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
      <view class="h-50 flex flex-col">
        <textarea
          v-model="content"
          placeholder="请输入正文内容..."
          class="w-full border border-gray-300 rounded-lg px-3 py-1 text-left focus:border-yellow focus:outline-none"
          rows="6"
          style="box-sizing:border-box"
        />
      </view>

      <!-- Tag Selection -->
      <view class="flex flex-col">
        <view class="flex flex-wrap gap-2">
          <checkbox-group>
            <label
              v-for="(tag, index) in availableTags"
              :key="index"
              class="flex items-center space-x-2"
            >
              <checkbox
                :value="tag"
                :checked="selectedTags.includes(tag)"
                class="text-yellow"
                @change="updateSelectedTags"
              />
              <text>{{ tag }}</text>
            </label>
          </checkbox-group>
        </view>
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
