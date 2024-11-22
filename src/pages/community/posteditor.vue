<script lang="ts">
import type { Post } from '@/types/Post'
import { defineComponent, ref } from 'vue'

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
    const publishPost = () => {
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

      uni.showToast({
        title: '已发布，待审核',
        icon: 'success',
        duration: 2000,
      })

      // 重置表单
      images.value = []
      title.value = ''
      content.value = ''
      selectedTags.value = []
    }

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
    }
  },
})
</script>

<template>
  <view class="min-h-screen flex flex-col bg-gray-100">
    <!-- Back Button -->
    <BackButton @back="handleBack" />

    <!-- Editor Content -->
    <view class="flex-1 p-4 space-y-4">
      <!-- Image Upload Section -->
      <view class="flex flex-col">
        <view class="flex flex-wrap justify-between">
          <!-- Display Uploaded Images -->
          <view
            v-for="(image, index) in images"
            :key="index"
            class="relative"
          >
            <image :src="image" class="h-24 w-24 rounded object-cover" />
            <view
              class="i-ci:close-sm absolute right-0 top-0 flex cursor-pointer items-center justify-center rounded-full bg-red-300 text-white"
              @click="removeImage(index)"
            />
          </view>
          <!-- Upload Button -->
          <view
            class="h-24 w-24 flex cursor-pointer items-center justify-center border-2 border-gray-300 rounded border-dashed"
            @click="chooseImages"
          >
            <view class="i-mynaui:upload text-3xl text-gray-400" />
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
          class="border-gray-300 rounded-lg border-dashed px-3 py-4 text-left text-gray-700"
        >
        <text class="mt-1 text-left text-sm text-gray-500">
          {{ title.length }}/18
        </text>
      </view>

      <!-- Content Editor -->
      <view class="flex flex-col">
        <textarea
          v-model="content"
          placeholder="请输入正文内容..."
          class="w-full border border-gray-300 rounded-lg px-3 py-1 text-left text-gray-700 focus:border-red-500 focus:outline-none"
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
                class="text-red-500"
                @change="updateSelectedTags"
              />
              <text class="text-gray-500">{{ tag }}</text>
            </label>
          </checkbox-group>
        </view>
      </view>
      <!-- Publish Button -->
      <button
        class="w-full rounded-lg bg-red-500 px-4 py-2 text-lg text-white font-semibold"
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
