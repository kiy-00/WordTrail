<script lang="ts">
import { API_BASE_URL } from '@/config/api'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'

interface UserLexicon {
  id: string
  bookName: string
  description: string
  language: string
  createUser: string
  words: string[]
  isPublic: boolean
  createTime: string
  status: string
  tags?: string[]
}

// 定义带有content属性的响应数据接口
interface ContentResponse {
  content: any[]
  [key: string]: any
}

export default defineComponent({
  props: {
    currentCard: { type: Number, default: 0 },
    totalCards: { type: Number, default: 10 },
    word: { type: String, required: true },
    wordId: { type: String, required: true }, // 添加wordId属性
  },
  setup(props) {
    // 在组件创建时检查wordId
    // eslint-disable-next-line no-console
    console.log('WordCardsHeader组件创建，收到的wordId:', props.wordId)

    const isCollected = ref(false)
    const showCollectModal = ref(false)
    const userLexicons = ref<UserLexicon[]>([])
    const isLoading = ref(false)
    const errorMessage = ref('')
    const selectedLexiconId = ref('')
    const userId = ref(uni.getStorageSync('userInfo')?.userId || 'ed62add4-bf40-4246-b7ab-2555015b383b')
    const collectedWordbooks = ref<{ id: string, name: string }[]>([]) // 新增：保存单词已被收藏到的词书信息

    // 获取当前选择的语言
    const currentLanguage = ref(uni.getStorageSync('selectedLanguage') || 'en')

    // 计算属性：根据当前语言过滤词书
    const filteredLexicons = computed(() => {
      return userLexicons.value.filter(lexicon =>
        lexicon.language === currentLanguage.value,
      )
    })

    // 获取用户创建的词书列表
    const fetchUserLexicons = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''

        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 调用API获取用户的词书列表
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/user-wordbooks/user/${userId.value}?page=0&size=100`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200 && response.data) {
          // 确保response.data是对象并且有content属性
          if (typeof response.data === 'object' && response.data !== null) {
            const responseData = response.data as ContentResponse

            if (responseData.content && Array.isArray(responseData.content)) {
              // 提取词书数据
              userLexicons.value = responseData.content.map((item: any) => ({
                id: item.id || '',
                bookName: item.bookName || '',
                description: item.description || '',
                language: item.language || '',
                createUser: item.createUser || '',
                words: Array.isArray(item.words) ? item.words : [],
                isPublic: typeof item.isPublic === 'boolean' ? item.isPublic : false,
                createTime: item.createTime || '',
                status: item.status || 'pending',
                tags: Array.isArray(item.tags) ? item.tags : [],
              }))

              // 查看过滤后是否有可用的词书
              if (filteredLexicons.value.length > 0) {
                // 如果有匹配当前语言的词书，默认选中第一个
                selectedLexiconId.value = filteredLexicons.value[0].id
              }
              else if (userLexicons.value.length > 0) {
                // 如果没有匹配当前语言的词书但有其他词书，则不预选
                selectedLexiconId.value = ''
                errorMessage.value = '没有找到当前语言的词书，请先创建匹配的词书'
              }
            }
            else {
              errorMessage.value = '响应数据格式不正确'
              console.error('响应数据没有content数组:', responseData)
            }
          }
          else if (typeof response.data === 'string') {
            try {
              // 尝试解析字符串为JSON
              const parsedData = JSON.parse(response.data) as ContentResponse

              if (parsedData.content && Array.isArray(parsedData.content)) {
                userLexicons.value = parsedData.content.map((item: any) => ({
                  // ...同上的映射逻辑
                  id: item.id || '',
                  bookName: item.bookName || '',
                  description: item.description || '',
                  language: item.language || '',
                  createUser: item.createUser || '',
                  words: Array.isArray(item.words) ? item.words : [],
                  isPublic: typeof item.isPublic === 'boolean' ? item.isPublic : false,
                  createTime: item.createTime || '',
                  status: item.status || 'pending',
                  tags: Array.isArray(item.tags) ? item.tags : [],
                }))
              }
            }
            catch (e) {
              errorMessage.value = '解析响应数据失败'
              console.error('解析字符串响应数据失败:', e)
            }
          }

          // 查看过滤后是否有可用的词书
          if (filteredLexicons.value.length > 0) {
            // 如果有匹配当前语言的词书，默认选中第一个
            selectedLexiconId.value = filteredLexicons.value[0].id
          }
          else if (userLexicons.value.length > 0) {
            // 如果没有匹配当前语言的词书但有其他词书，则不预选
            selectedLexiconId.value = ''
            errorMessage.value = '没有找到当前语言的词书，请先创建匹配的词书'
          }
        }
        else {
          errorMessage.value = '获取词书列表失败'
          console.error('获取词书列表失败:', response)
        }
      }
      catch (error) {
        errorMessage.value = '网络错误，请稍后再试'
        console.error('获取词书列表错误:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 检查单词是否已被收藏到用户词书
    const checkIfWordIsCollected = async () => {
      if (!props.wordId) {
        console.error('无法检查收藏状态：单词ID为空')
        return
      }

      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          console.error('无法检查收藏状态：未登录')
          return
        }

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/user-wordbooks/user/${userId.value}/check-word/${props.wordId}`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200 && response.data) {
          const result = response.data as { exists: boolean, wordbooks?: { id: string, name: string }[] }

          // 更新收藏状态
          isCollected.value = result.exists === true

          // 保存词书信息
          if (result.wordbooks && Array.isArray(result.wordbooks)) {
            collectedWordbooks.value = result.wordbooks
            // eslint-disable-next-line no-console
            console.log('单词已收藏到词书:', collectedWordbooks.value)
          }
        }
        else {
          console.error('检查单词收藏状态失败:', response)
        }
      }
      catch (error) {
        console.error('检查单词收藏状态出错:', error)
      }
    }

    // 收藏单词到指定词书
    const addWordToLexicon = async () => {
      // 调试输出 - 去掉词书ID显示，保留单词ID显示
      // eslint-disable-next-line no-console
      console.log('收藏单词 - 参数检查:')
      // eslint-disable-next-line no-console
      console.log('- 单词ID:', props.wordId || '空')
      // eslint-disable-next-line no-console
      console.log('- 选中词书ID:', selectedLexiconId.value || '未选择')

      // 修复：先检查是否真的没有选中词书
      if (!selectedLexiconId.value) {
        // 如果没有选中，尝试使用第一个可用的词书
        if (filteredLexicons.value.length > 0) {
          selectedLexiconId.value = filteredLexicons.value[0].id
          // eslint-disable-next-line no-console
          console.log('自动选择第一个词书:', selectedLexiconId.value)
        }
        else {
          uni.showToast({
            title: '请选择词书',
            icon: 'none',
          })
          return
        }
      }

      if (!props.wordId) {
        console.error('单词ID为空，当前props:', props)
        uni.showToast({
          title: '单词ID为空',
          icon: 'none',
        })
        return
      }

      try {
        isLoading.value = true

        const token = uni.getStorageSync('token')

        // 记录请求参数用于调试
        // eslint-disable-next-line no-console
        console.log('收藏单词 - 请求参数:', {
          词书ID: selectedLexiconId.value,
          单词ID: props.wordId,
          用户ID: userId.value,
        })

        // 根据后端API的定义，直接发送字符串ID数组作为请求体
        // @RequestBody List<String> wordIds
        const requestBody = [props.wordId] // 注意，这里就是一个简单的数组，不要包装在对象中

        // 调用API将单词添加到词书
        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/user-wordbooks/${selectedLexiconId.value}/words/user/${userId.value}`,
          method: 'POST',
          data: requestBody, // 直接发送数组
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        // eslint-disable-next-line no-console
        console.log('添加单词API响应:', {
          状态码: response.statusCode,
          响应数据: response.data,
          请求体: requestBody,
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          uni.showToast({
            title: '收藏成功',
            icon: 'success',
          })

          // 收藏成功后更新状态
          await checkIfWordIsCollected()

          showCollectModal.value = false
        }
        else {
          // 显示错误信息
          let errorMsg = '收藏失败'
          if (response.data && typeof response.data === 'string' && response.data.trim() !== '') {
            errorMsg += `: ${response.data}`
          }

          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000,
          })
          console.error('收藏单词失败:', response)
        }
      }
      catch (error) {
        const errorMessage = error instanceof Error ? error.message : '网络错误'
        uni.showToast({
          title: `收藏失败: ${errorMessage}`,
          icon: 'none',
          duration: 3000,
        })
        console.error('收藏单词错误:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 打开收藏模态框
    const onCollect = async () => {
      // eslint-disable-next-line no-console
      console.log('打开收藏模态框，当前wordId:', props.wordId)

      if (!props.wordId) {
        uni.showToast({
          title: '无法收藏：单词ID不存在',
          icon: 'none',
        })
        console.error('无法收藏，缺少单词ID，props:', props)
        return
      }

      // 如果已收藏，显示已收藏的词书信息
      if (isCollected.value) {
        let message = '单词已收藏到：\n'
        collectedWordbooks.value.forEach((book) => {
          message += `- ${book.name}\n`
        })

        uni.showModal({
          title: '已收藏',
          content: message,
          showCancel: false,
          confirmText: '确定',
        })
        return
      }

      // 加载用户的词书列表
      await fetchUserLexicons()

      // 如果没有当前语言的词书，给出提示
      if (filteredLexicons.value.length === 0) {
        uni.showModal({
          title: '提示',
          content: `没有找到${currentLanguage.value === 'en' ? '英语' : currentLanguage.value === 'fr' ? '法语' : currentLanguage.value === 'de' ? '德语' : '当前语言'}的词书，是否前往创建?`,
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/lexicon/createuserlexicon' })
            }
          },
        })
        return
      }

      // 显示模态框
      showCollectModal.value = true
    }

    const onBack = () => {
      uni.navigateBack()
    }

    const onMarkAsKnown = () => {
      uni.showToast({
        title: '已标记为认识',
        icon: 'success',
      })
    }

    // 修改选择词书的处理方法，确保正确设置ID
    const handleLexiconSelect = (lexiconId: string) => {
      // eslint-disable-next-line no-console
      console.log('选中词书:', lexiconId)
      selectedLexiconId.value = lexiconId
    }

    const closeModal = () => {
      showCollectModal.value = false
    }

    // 在组件挂载时和wordId变化时检查收藏状态
    onMounted(() => {
      if (props.wordId) {
        checkIfWordIsCollected()
      }
    })

    // 监听wordId变化
    watch(() => props.wordId, (newWordId) => {
      if (newWordId) {
        checkIfWordIsCollected()
      }
      else {
        // 如果wordId为空，重置收藏状态
        isCollected.value = false
        collectedWordbooks.value = []
      }
    })

    return {
      isCollected,
      showCollectModal,
      userLexicons,
      filteredLexicons, // 使用过滤后的词书列表
      isLoading,
      errorMessage,
      selectedLexiconId,
      currentLanguage,
      collectedWordbooks, // 新增：导出收藏词书列表
      onCollect,
      onBack,
      onMarkAsKnown,
      addWordToLexicon,
      handleLexiconSelect,
      closeModal,
    }
  },
})
</script>

<template>
  <view class="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-white bg-opacity-20 px-5 py-3 frosted-glass">
    <view class="flex items-center gap-4">
      <view class="flex cursor-pointer items-center justify-center" @click="onBack">
        <view class="i-mynaui:arrow-left text-2xl text-white" />
      </view>
      <text class="text-lg text-white font-sans">
        {{ currentCard }} / {{ totalCards }}
      </text>
    </view>

    <view class="flex items-center gap-4">
      <view class="flex cursor-pointer items-center justify-center" @click="onCollect">
        <view :class="isCollected ? 'i-mynaui:star-solid text-yellow' : 'i-mynaui:star'" class="text-2xl text-white" />
      </view>
      <view class="flex cursor-pointer items-center justify-center" @click="onMarkAsKnown">
        <view class="i-mynaui:trash text-2xl text-white" />
      </view>
    </view>
  </view>

  <!-- 收藏模态框 -->
  <view v-if="showCollectModal" class="fixed inset-0 z-100 flex items-center justify-center bg-black bg-opacity-50">
    <view class="mx-4 max-h-80% w-full rounded-lg shadow-lg frosted-glass">
      <!-- 模态框标题 -->
      <view class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <text class="text-lg font-semibold">
          选择词书 ({{ currentLanguage === 'en' ? '英语' : currentLanguage === 'fr' ? '法语' : currentLanguage === 'de' ? '德语' : '未知语言' }})
        </text>
        <view class="cursor-pointer p-2" @click="closeModal">
          <view class="i-carbon:close text-lg" />
        </view>
      </view>

      <!-- 词书列表 -->
      <scroll-view scroll-y class="max-h-60 px-4 py-2">
        <view v-if="isLoading" class="py-4 text-center">
          <view class="i-carbon:progress-bar mx-auto animate-spin text-xl" />
          <text class="mt-2 block text-sm text-gray-500">
            加载中...
          </text>
        </view>

        <view v-else-if="errorMessage" class="py-4 text-center text-red-500">
          {{ errorMessage }}
        </view>

        <view v-else-if="filteredLexicons.length === 0" class="py-4 text-center text-gray-500">
          没有找到当前语言的词书
        </view>

        <view v-else class="space-y-2">
          <view
            v-for="lexicon in filteredLexicons"
            :key="lexicon.id"
            class="w-84% border rounded-lg p-3"
            :class="selectedLexiconId === lexicon.id ? 'border-yellow bg-yellow/10' : 'border-gray-200'"
            @click="handleLexiconSelect(lexicon.id)"
          >
            <view class="flex items-center">
              <view class="mr-2 h-4 w-4 rounded-full" :class="selectedLexiconId === lexicon.id ? 'bg-yellow' : 'bg-gray-300'" />
              <view class="flex-1">
                <text class="block font-medium">
                  {{ lexicon.bookName }}
                </text>
                <text class="block text-xs text-gray-500">
                  {{ lexicon.words.length }}个单词
                </text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 操作按钮 -->
      <view class="flex justify-end border-t border-gray-200 px-4 py-3 space-x-2">
        <view
          class="border border-gray-300 rounded-lg px-4 py-2 text-gray-700"
          @click="closeModal"
        >
          取消
        </view>
        <view
          class="rounded-lg bg-yellow px-4 py-2 text-white"
          :class="{ 'opacity-50': isLoading }"
          @click="addWordToLexicon"
        >
          {{ isLoading ? '添加中...' : `添加到"${filteredLexicons.find(l => l.id === selectedLexiconId)?.bookName || '选中词书'}"` }}
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.frosted-glass {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.cursor-pointer {
  cursor: pointer;
}

.z-100 {
  z-index: 100;
}

.max-h-80\% {
  max-height: 80%;
}

.max-h-60 {
  max-height: 15rem;
}
</style>
