<script lang="ts">
import type { UserDetail } from '@/services/userService'
import { API_BASE_URL } from '@/config/api'
import { getUserDetailById } from '@/services/userService'
import { computed, defineComponent, onMounted, ref } from 'vue'

interface Word {
  _id: {
    timestamp: number
    date: string
  }
  word: string
  language: string
  difficulty: number
  synonyms: string[]
  antonyms: string[]
  partOfSpeechList: Array<{
    type: string
    definitions: string[]
    gender?: string
    plural?: string
    examples?: Array<{
      sentence: string
      translation: string
    }>
  }>
  phonetics: Array<{
    ipa: string
    audio: string
  }>
  tags: string[]
}

interface UserWordbook {
  id: string
  bookName: string
  description: string
  language: string
  createUser: string
  createTime: string
  isPublic: boolean
  status: string
  tags: string[] | null
  words: string[] // 单词ID列表
}

export default defineComponent({
  name: 'UserLexiconDetail',
  setup() {
    const id = ref('')
    const lexiconDetail = ref<UserWordbook | null>(null)
    const loading = ref(true)
    const words = ref<Word[]>([])
    const loadingWords = ref(false)
    const currentPage = ref(0)
    const pageSize = ref(10)
    const totalWords = ref(0)
    const hasMoreWords = ref(true)
    const creatorInfo = ref<UserDetail | null>(null)
    const loadingCreator = ref(false)

    const loadWords = async () => {
      if (!lexiconDetail.value || !lexiconDetail.value.words?.length) {
        hasMoreWords.value = false
        return
      }

      try {
        loadingWords.value = true
        const token = uni.getStorageSync('token')

        const startIndex = currentPage.value * pageSize.value
        const endIndex = Math.min(startIndex + pageSize.value, lexiconDetail.value.words.length)
        const wordIds = lexiconDetail.value.words.slice(startIndex, endIndex)

        // 如果已经加载了所有单词
        if (startIndex >= lexiconDetail.value.words.length) {
          hasMoreWords.value = false
          return
        }

        // 并行请求多个单词的详细信息
        const wordPromises = wordIds.map(wordId =>
          uni.request({
            url: `${API_BASE_URL}/api/v1/words/${wordId}`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        )

        const responses = await Promise.all(wordPromises)

        const newWords = responses
          .filter(response => response.statusCode === 200 && response.data)
          .map(response => response.data as Word)

        words.value = [...words.value, ...newWords]

        // 更新页码和检查是否还有更多
        currentPage.value++
        hasMoreWords.value = words.value.length < (lexiconDetail.value.words?.length || 0)
      }
      catch (error) {
        uni.showToast({
          title: '获取单词信息失败',
          icon: 'none',
          duration: 2000,
        })
        console.error('加载单词失败:', error)
      }
      finally {
        loadingWords.value = false
      }
    }

    // 获取创建者信息
    const fetchCreatorInfo = async (userId: string) => {
      try {
        loadingCreator.value = true
        creatorInfo.value = await getUserDetailById(userId)
        console.error('创建者信息:', creatorInfo.value)
      }
      catch (error) {
        console.error('获取创建者信息失败:', error)
      }
      finally {
        loadingCreator.value = false
      }
    }

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

        const response = await uni.request({
          url: `${API_BASE_URL}/api/v1/user-wordbooks/${id.value}`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.statusCode === 200) {
          lexiconDetail.value = response.data as UserWordbook
          console.error('用户词书详情:', lexiconDetail.value)
          if (lexiconDetail.value && lexiconDetail.value.words) {
            totalWords.value = lexiconDetail.value.words.length || 0

            // 初始加载词书的前10个单词
            await loadWords()

            // 获取创建者信息
            if (lexiconDetail.value.createUser) {
              await fetchCreatorInfo(lexiconDetail.value.createUser)
            }
          }
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

    const selectLexicon = async () => {
      // Add null check
      if (!lexiconDetail.value)
        return

      uni.showModal({
        title: '📚 确认选择',
        content: `确定要选择「${lexiconDetail.value.bookName}」作为您的词书吗？`,
        success: (res) => {
          if (res.confirm) {
            try {
              // 保存词书信息到本地存储
              uni.setStorageSync('currentLexicon', {
                id: lexiconDetail.value!.id,
                name: lexiconDetail.value!.bookName,
              })

              uni.showToast({
                title: '选择成功',
                icon: 'success',
                duration: 2000,
              })

              setTimeout(() => {
                uni.navigateBack()
              }, 2000)
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

    // 打开单词详情
    const openWordDetail = (word: Word) => {
      uni.navigateTo({
        url: `/pages/word/worddetail?id=${word._id.timestamp}`,
      })
    }

    // 滚动到底部时加载更多单词
    const onScrollToLower = () => {
      if (!loadingWords.value && hasMoreWords.value) {
        loadWords()
      }
    }

    // 将时间格式化逻辑封装到 computed 属性中，避免直接访问 lexiconDetail.value 可能的空值
    const createTimeString = computed(() => {
      const rawTime = lexiconDetail.value?.createTime ?? ''
      return formatDate(rawTime)
    })

    // 添加其他安全访问的计算属性
    const bookDescription = computed(() => lexiconDetail.value?.description ?? '')
    const bookLanguage = computed(() => lexiconDetail.value?.language ?? '')
    const bookTags = computed(() => lexiconDetail.value?.tags ?? [])
    const isPublic = computed(() => lexiconDetail.value?.isPublic ?? false)
    const bookStatus = computed(() => lexiconDetail.value?.status ?? '')
    const bookName = computed(() => lexiconDetail.value?.bookName ?? '')

    // 修改创建者信息的计算属性
    const bookCreator = computed(() => {
      if (creatorInfo.value) {
        return creatorInfo.value.username
      }
      return lexiconDetail.value?.createUser ?? ''
    })

    onMounted(() => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as any
      const options = currentPage.$page?.options

      if (options) {
        id.value = options.id || ''
        fetchLexiconDetail()
      }
    })

    return {
      id,
      lexiconDetail,
      loading,
      words,
      loadingWords,
      hasMoreWords,
      totalWords,
      formatDate,
      handleBack,
      selectLexicon,
      openWordDetail,
      onScrollToLower,
      loadWords,
      createTimeString,
      creatorInfo,
      loadingCreator,
      // 导出计算属性
      bookDescription,
      bookLanguage,
      bookCreator,
      bookTags,
      isPublic,
      bookStatus,
      bookName,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <scroll-view
    class="h-screen"
    :scroll-y="true"
    @scrolltolower="onScrollToLower"
  >
    <view class="p-4">
      <!-- 加载状态 -->
      <view v-if="loading" class="h-80 flex items-center justify-center">
        <view class="i-tabler:loader-2 animate-spin text-4xl text-yellow" />
      </view>

      <!-- 词书详情 -->
      <template v-else-if="lexiconDetail">
        <!-- 词书标题和图标 -->
        <view class="mb-6 flex flex-col items-center justify-center">
          <view class="mb-3 h-32 w-32 flex items-center justify-center rounded-lg bg-yellow-50">
            <view class="i-carbon:book text-6xl text-yellow" />
          </view>
          <view class="text-2xl text-yellow font-bold">
            {{ bookName }}
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="mb-6 rounded-lg bg-gray-50 p-4 shadow-sm">
          <view class="mb-2 text-lg text-yellow font-bold">
            基本信息
          </view>
          <view class="mb-2 flex">
            <text class="w-20 flex-shrink-0 text-gray-600 font-bold">
              描述：
            </text>
            <text class="text-gray-700">
              {{ bookDescription }}
            </text>
          </view>
          <view class="mb-2 flex">
            <text class="w-20 flex-shrink-0 text-gray-600 font-bold">
              语言：
            </text>
            <text class="text-gray-700">
              {{ bookLanguage }}
            </text>
          </view>
          <view class="mb-2 flex">
            <text class="w-20 flex-shrink-0 text-gray-600 font-bold">
              创建者：
            </text>
            <view class="flex-1">
              <text v-if="loadingCreator" class="text-gray-400">
                加载中...
              </text>
              <view v-else-if="creatorInfo" class="flex items-center">
                <text class="text-gray-700">
                  {{ creatorInfo.username }}
                </text>
              </view>
              <text v-else class="text-gray-700">
                {{ bookCreator }}
              </text>
            </view>
          </view>
          <view class="mb-2 flex">
            <text class="w-20 flex-shrink-0 text-gray-600 font-bold">
              创建时间：
            </text>
            <text class="text-gray-700">
              {{ createTimeString }}
            </text>
          </view>
          <view class="mb-2 flex">
            <text class="w-20 flex-shrink-0 text-gray-600 font-bold">
              单词数量：
            </text>
            <text class="text-gray-700">
              {{ totalWords }}
            </text>
          </view>
        </view>

        <!-- 标签和状态 -->
        <view class="mb-6 rounded-lg bg-gray-50 p-4 shadow-sm">
          <view class="mb-2 text-lg text-yellow font-bold">
            其他信息
          </view>

          <!-- 标签 -->
          <view v-if="bookTags && bookTags.length" class="mb-3">
            <text class="text-gray-600 font-bold">
              标签：
            </text>
            <view class="mt-1 flex flex-wrap gap-2">
              <view
                v-for="tag in bookTags"
                :key="tag"
                class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
              >
                {{ tag }}
              </view>
            </view>
          </view>

          <!-- 状态信息 -->
          <view class="flex items-center gap-2">
            <text class="text-gray-600 font-bold">
              状态：
            </text>

            <view
              class="rounded-full px-2 py-0.5 text-xs"
              :class="isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
            >
              {{ isPublic ? '公开' : '私有' }}
            </view>

            <view
              class="rounded-full px-2 py-0.5 text-xs"
              :class="{
                'bg-green-100 text-green-700': bookStatus === 'approved',
                'bg-yellow-100 text-yellow-700': bookStatus === 'pending',
                'bg-red-100 text-red-700': bookStatus === 'rejected',
              }"
            >
              {{ bookStatus === 'approved' ? '已审核'
                : bookStatus === 'pending' ? '审核中' : '已拒绝' }}
            </view>
          </view>
        </view>

        <!-- 单词列表 -->
        <view class="mb-6">
          <view class="mb-3 flex items-center justify-between">
            <text class="text-lg text-yellow font-bold">
              单词列表
            </text>
            <text class="text-sm text-gray-500">
              {{ words.length }}/{{ totalWords }}
            </text>
          </view>

          <!-- 单词卡片 -->
          <view v-if="words.length > 0">
            <WordBox
              v-for="word in words"
              :key="word._id.timestamp"
              :word-data="word"
              class="mb-4"
              @click="openWordDetail(word)"
            />

            <!-- 加载更多指示器 -->
            <view v-if="loadingWords" class="my-4 flex justify-center">
              <view class="i-tabler:loader-2 animate-spin text-2xl text-yellow" />
            </view>

            <!-- 加载更多按钮 -->
            <view v-else-if="hasMoreWords" class="my-4 flex justify-center">
              <button
                class="rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-600"
                @click="loadWords"
              >
                加载更多
              </button>
            </view>

            <!-- 已加载全部提示 -->
            <view v-else class="my-4 text-center text-sm text-gray-500">
              已加载全部单词
            </view>
          </view>

          <!-- 无单词状态 -->
          <view v-else-if="!loadingWords" class="py-10 text-center text-gray-500">
            词书中暂无单词
          </view>

          <!-- 初始加载状态 -->
          <view v-else class="h-40 flex items-center justify-center">
            <view class="i-tabler:loader-2 animate-spin text-2xl text-yellow" />
          </view>
        </view>

        <!-- 选择按钮 -->
        <button
          class="mb-8 w-full rounded-lg bg-yellow py-3 text-white font-bold"
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
  </scroll-view>
</template>

<route lang="json">
{
  "layout": "default"
}
</route>

<style scoped>
</style>
