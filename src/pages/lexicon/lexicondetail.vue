<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'LexiconDetail',
  setup() {
    const id = ref('')
    const type = ref<'system' | 'user'>('system')
    const lexiconDetail = ref<any>(null)
    const loading = ref(true)

    const fetchLexiconDetail = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000,
          })
          uni.redirectTo({ url: '/pages/user/login' })
          return
        }

        loading.value = true

        // 基于词书类型选择不同的API端点
        const apiUrl = type.value === 'system'
          ? `${API_BASE_URL}/api/v1/system-wordbooks/${id.value}`
          : `${API_BASE_URL}/api/v1/user-wordbooks/${id.value}`

        const response = await uni.request({
          url: apiUrl,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200) {
          lexiconDetail.value = response.data
          console.error('词书详情:', lexiconDetail.value)
        }
        else if (response.statusCode === 401 || response.statusCode === 403) {
          uni.showToast({
            title: '请重新登录',
            icon: 'none',
            duration: 2000,
          })
          uni.redirectTo({ url: '/pages/user/login' })
        }
        else {
          throw new Error('获取词书详情失败')
        }
      }
      catch (error) {
        uni.showToast({
          title: '获取词书详情失败',
          icon: 'none',
          duration: 2000,
        })
        console.error(error)
      }
      finally {
        loading.value = false
      }
    }

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString)
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
      }
      catch {
        return '未知日期'
      }
    }

    const handleBack = () => {
      uni.navigateBack()
    }

    // 选定该词书
    const selectLexicon = async () => {
      if (!lexiconDetail.value)
        return

      uni.showModal({
        title: '📚 确认选择',
        content: `确定要选择「${lexiconDetail.value.bookName}」作为您的词书吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const token = uni.getStorageSync('token')
              const response = await uni.request({
                url: `${API_BASE_URL}/api/v1/user/select-wordbook/${id.value}`,
                method: 'POST',
                header: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              })

              if (response.statusCode === 200) {
                uni.showToast({
                  title: '选择成功',
                  icon: 'success',
                  duration: 2000,
                })

                // 保存到本地存储
                uni.setStorageSync('currentLexicon', {
                  id: lexiconDetail.value.id,
                  name: lexiconDetail.value.bookName,
                })

                setTimeout(() => {
                  uni.navigateBack()
                }, 2000)
              }
              else {
                throw new Error('选择词书失败')
              }
            }
            catch (error) {
              uni.showToast({
                title: '选择失败，请重试',
                icon: 'none',
                duration: 2000,
              })
              console.error(error)
            }
          }
        },
      })
    }

    onMounted(() => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as any
      const options = currentPage.$page?.options

      if (options) {
        id.value = options.id || ''
        type.value = (options.type as 'system' | 'user') || 'system'
        fetchLexiconDetail()
      }
    })

    return {
      id,
      type,
      lexiconDetail,
      loading,
      formatDate,
      handleBack,
      selectLexicon,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <view class="p-4">
    <!-- 加载状态 -->
    <view v-if="loading" class="h-80 flex items-center justify-center">
      <view class="i-tabler:loader-2 animate-spin text-4xl text-yellow" />
    </view>

    <!-- 词书详情 -->
    <template v-else-if="lexiconDetail">
      <view class="mb-6 flex flex-col items-center justify-center">
        <view class="mb-3 h-32 w-32 flex items-center justify-center rounded-lg bg-yellow-50">
          <view class="i-carbon:book text-6xl text-yellow" />
        </view>
        <view class="text-2xl text-yellow font-bold">
          {{ lexiconDetail.bookName }}
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="mb-6 rounded-lg bg-gray-50 p-4">
        <view class="mb-2 text-lg text-gray-700 font-bold">
          基本信息
        </view>
        <view class="mb-2">
          <text class="text-gray-600 font-bold">
            描述：
          </text>
          <text class="text-gray-700">
            {{ lexiconDetail.description }}
          </text>
        </view>
        <view class="mb-2">
          <text class="text-gray-600 font-bold">
            语言：
          </text>
          <text class="text-gray-700">
            {{ lexiconDetail.language }}
          </text>
        </view>
        <view v-if="lexiconDetail.wordCount !== undefined" class="mb-2">
          <text class="text-gray-600 font-bold">
            单词数量：
          </text>
          <text class="text-gray-700">
            {{ lexiconDetail.wordCount || lexiconDetail.words?.length || '未知' }}
          </text>
        </view>
      </view>

      <!-- 用户词书特有信息 -->
      <view v-if="type === 'user'" class="mb-6 rounded-lg bg-gray-50 p-4">
        <view class="mb-2 text-lg text-gray-700 font-bold">
          创建信息
        </view>
        <view class="mb-2">
          <text class="text-gray-600 font-bold">
            创建者：
          </text>
          <text class="text-gray-700">
            {{ lexiconDetail.createUser || '未知' }}
          </text>
        </view>
        <view class="mb-2">
          <text class="text-gray-600 font-bold">
            创建时间：
          </text>
          <text class="text-gray-700">
            {{ lexiconDetail.createTime ? formatDate(lexiconDetail.createTime) : '未知' }}
          </text>
        </view>
        <view class="mb-2">
          <text class="text-gray-600 font-bold">
            状态：
          </text>
          <text
            class="rounded-full px-2 py-0.5 text-xs"
            :class="{
              'bg-green-100 text-green-700': lexiconDetail.status === 'approved',
              'bg-yellow-100 text-yellow-700': lexiconDetail.status === 'pending',
              'bg-red-100 text-red-700': lexiconDetail.status === 'rejected',
            }"
          >
            {{ lexiconDetail.status === 'approved' ? '已审核'
              : lexiconDetail.status === 'pending' ? '审核中' : '已拒绝' }}
          </text>
          <text
            class="ml-2 rounded-full px-2 py-0.5 text-xs"
            :class="lexiconDetail.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
          >
            {{ lexiconDetail.isPublic ? '公开' : '私有' }}
          </text>
        </view>
      </view>

      <!-- 单词预览 -->
      <view class="mb-6 rounded-lg bg-gray-50 p-4">
        <view class="mb-2 text-lg text-gray-700 font-bold">
          单词预览 (最多显示5个)
        </view>
        <template v-if="lexiconDetail.words && lexiconDetail.words.length > 0">
          <view
            v-for="(word, index) in lexiconDetail.words.slice(0, 5)"
            :key="index"
            class="mb-2 border-b border-gray-100 pb-2"
          >
            <view class="font-bold">
              {{ word.spelling }}
            </view>
            <view class="text-sm text-gray-600">
              {{ word.translation }}
            </view>
          </view>
        </template>
        <view v-else class="py-2 text-center text-gray-500">
          暂无单词数据
        </view>
      </view>

      <!-- 选择按钮 -->
      <button
        class="w-full rounded-lg bg-yellow py-3 text-white font-bold"
        @click="selectLexicon"
      >
        选择此词书
      </button>
    </template>

    <!-- 无数据状态 -->
    <view v-else class="h-80 flex flex-col items-center justify-center">
      <view class="i-carbon:document-error mb-2 text-4xl text-gray-400" />
      <text class="text-gray-500">
        找不到词书信息
      </text>
    </view>
  </view>
</template>

<route lang="json">
{
  "layout": "default"
}
</route>

<style scoped>
</style>
