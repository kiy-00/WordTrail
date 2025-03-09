<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import UserLexiconBox from '@/components/UserLexiconBox.vue'
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

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

interface PageResponse {
  content: UserLexicon[]
  pageable: {
    pageSize: number
    pageNumber: number
  }
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  empty: boolean
}

export default defineComponent({
  name: 'MyUserLexicon',
  components: {
    BackButton,
    UserLexiconBox,
  },
  setup() {
    const userLexicons = ref<UserLexicon[]>([])
    const isLoading = ref(false)
    const isRefreshing = ref(false)
    const currentPage = ref(0)
    const totalPages = ref(0)
    const pageSize = ref(10)
    const hasMore = ref(true)
    const errorMessage = ref('')
    const userId = ref(uni.getStorageSync('userInfo')?.userId || 'ed62add4-bf40-4246-b7ab-2555015b383b')

    // eslint-disable-next-line no-console
    console.log('当前用户ID:', userId.value)

    // 根据语言获取国旗表情
    const getLanguageEmoji = (language: string): string => {
      switch (language) {
        case 'en': return '🇺🇸'
        case 'fr': return '🇫🇷'
        case 'de': return '🇩🇪'
        default: return '🌍'
      }
    }

    // 获取用户创建的词书列表 - 修改为使用正确的API端点和参数
    const fetchUserLexicons = async (page = 0, refresh = false) => {
      try {
        isLoading.value = true
        errorMessage.value = ''

        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          uni.navigateTo({ url: '/pages/user/login' })
          return
        }

        // 构建API URL - 根据后端接口定义修改
        const requestUrl = `${API_BASE_URL}/api/v1/user-wordbooks/user/${userId.value}`

        // eslint-disable-next-line no-console
        console.log('请求URL:', requestUrl)

        // 请求参数 - 根据接口定义
        const queryParams = `page=${page}&size=${pageSize.value}`
        const fullUrl = `${requestUrl}?${queryParams}`

        // eslint-disable-next-line no-console
        console.log('完整请求URL:', fullUrl)

        // 发送请求 - 使用正确的HTTP方法(GET)和参数
        const response = await uni.request({
          url: fullUrl,
          method: 'GET', // 确保使用GET方法
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        // eslint-disable-next-line no-console
        console.log('API响应状态码:', response.statusCode)
        // eslint-disable-next-line no-console
        console.log('API完整响应:', JSON.stringify(response.data))

        // 处理响应
        if (response.statusCode === 200) {
          // 使用类型断言处理可能的类型不匹配
          const responseData = response.data as any

          // 确保我们得到了一个符合PageResponse接口的对象
          if (typeof responseData !== 'object' || !responseData) {
            console.error('响应不是一个有效对象:', response)
            errorMessage.value = '响应数据格式错误'
            return
          }

          // 检查必要的属性
          if (!('content' in responseData) || !Array.isArray(responseData.content)) {
            console.error('返回的数据不包含content数组:', responseData)
            errorMessage.value = '返回的数据格式不符合预期'
            return
          }

          // 提取并处理词书数据
          const pageData = {
            content: responseData.content.map((item: any) => ({
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
            })),
            pageable: responseData.pageable || { pageNumber: page, pageSize: pageSize.value },
            totalPages: responseData.totalPages || 1,
            totalElements: responseData.totalElements || 0,
            last: responseData.last === true,
            first: responseData.first === true,
            empty: responseData.empty === true,
          } as PageResponse

          // 更新页面状态
          totalPages.value = pageData.totalPages
          hasMore.value = !pageData.last
          currentPage.value = pageData.pageable?.pageNumber || page

          // eslint-disable-next-line no-console
          console.log('解析后的词书数量:', pageData.content.length)

          if (refresh) {
            userLexicons.value = pageData.content
          }
          else {
            userLexicons.value = [...userLexicons.value, ...pageData.content]
          }

          // eslint-disable-next-line no-console
          console.log('当前词书列表:', userLexicons.value)
        }
        else {
          errorMessage.value = `获取词书列表失败: ${response.statusCode}`
          console.error('获取词书列表失败:', response)
        }
      }
      catch (error) {
        errorMessage.value = '网络错误，请稍后再试'
        console.error('获取词书列表发生错误:', error)
      }
      finally {
        isLoading.value = false
        isRefreshing.value = false
      }
    }

    // 下拉刷新
    const onRefresh = async () => {
      isRefreshing.value = true
      await fetchUserLexicons(0, true)
    }

    // 加载更多
    const loadMore = async () => {
      if (!hasMore.value || isLoading.value)
        return
      await fetchUserLexicons(currentPage.value + 1)
    }

    // 创建新的词书
    const createNewLexicon = () => {
      uni.navigateTo({ url: '/pages/lexicon/createuserlexicon' })
    }

    // 点击词书进入详情页
    const handleLexiconClick = (lexicon: UserLexicon) => {
      uni.navigateTo({
        url: `/pages/lexicon/userlexicondetail?id=${lexicon.id}&type=user`,
      })
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    // 页面加载时获取词书列表
    onMounted(() => {
      fetchUserLexicons(0, true)
    })

    return {
      userLexicons,
      isLoading,
      isRefreshing,
      errorMessage,
      hasMore,
      onRefresh,
      loadMore,
      createNewLexicon,
      handleLexiconClick,
      handleBack,
      getLanguageEmoji,
    }
  },
})
</script>

<template>
  <BackButton @back="handleBack" />

  <!-- 顶部栏 -->
  <view class="fixed left-0 top-0 z-10 mt-20 w-full flex items-center justify-between px-4 py-3 frosted-glass">
    <text class="text-xl font-bold">
      我的词书
    </text>
    <view class="h-8 w-8">
      <!-- 占位 -->
    </view>
  </view>

  <!-- 内容区域 -->
  <scroll-view
    class="mt-24 flex-1"
    scroll-y
    refresher-enabled
    :refresher-triggered="isRefreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
  >
    <!-- 错误信息 -->
    <view v-if="errorMessage" class="my-4 rounded-lg bg-red-50 p-4 text-center text-red-500">
      {{ errorMessage }}
    </view>

    <!-- 加载中 -->
    <view v-if="isLoading && userLexicons.length === 0" class="my-4 p-4 text-center">
      <view class="i-carbon:progress-bar animate-spin text-2xl" />
      <text class="mt-2 block">
        加载中...
      </text>
    </view>

    <!-- 词书列表 -->
    <view v-if="userLexicons.length > 0" class="my-4">
      <UserLexiconBox
        v-for="lexicon in userLexicons"
        :id="lexicon.id"
        :key="lexicon.id"
        :name="lexicon.bookName"
        :description="lexicon.description"
        :create-time="lexicon.createTime"
        :is-public="lexicon.isPublic"
        :status="lexicon.status"
        :tags="lexicon.tags || []"
        :create-user="lexicon.createUser"
        :word-count="lexicon.words?.length || 0"
        :url="`/pages/lexicon/userlexicondetail?id=${lexicon.id}&type=user`"
        image-url="/static/lexicon.png"
        @click="handleLexiconClick(lexicon)"
      />
    </view>

    <!-- 空状态 -->
    <view v-else-if="!isLoading" class="my-8 flex flex-col items-center justify-center">
      <view class="i-carbon:catalog text-6xl text-gray-300" />
      <text class="mt-4 text-lg text-gray-500">
        还没有创建任何词书
      </text>
    </view>

    <!-- 加载更多状态 -->
    <view v-if="hasMore && userLexicons.length > 0" class="my-4 text-center text-gray-500">
      加载更多...
    </view>
    <view v-else-if="userLexicons.length > 0" class="my-4 text-center text-gray-400">
      没有更多了
    </view>
  </scroll-view>

  <!-- 悬浮添加按钮 -->
  <view
    class="fixed bottom-20 right-6 h-14 w-14 flex items-center justify-center rounded-full bg-yellow shadow-lg"
    @click="createNewLexicon"
  >
    <view class="i-carbon:add text-2xl text-white" />
  </view>
</template>

<style scoped>
/* 可以根据需要添加样式 */
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
