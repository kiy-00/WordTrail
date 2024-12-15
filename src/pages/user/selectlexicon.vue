<script lang="ts">
import type { LexiconStatus } from '@/components/LexiconBox.vue'
import type { Lexicon } from '@/types/Lexicon'
import { LexiconAPI } from '@/types/Lexicon'
import { LanguageStorage } from '@/utils/languageStorage'
import { LexiconStorage } from '@/utils/lexiconStorage'
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  name: 'SelectLexicon', // 修正：bookName -> name

  setup() {
    const activeTab = ref<'all' | LexiconStatus>('all') // 注释而不是删除
    const allLexicons = ref<Lexicon[]>([])
    const displayedLexicons = ref<Lexicon[]>([])
    const isRefreshing = ref(false)
    const lexiconsPerLoad = 20
    const currentLoad = ref(1)
    const searchQuery = ref('')
    const isSearchVisible = ref(false)
    const selectedLanguage = ref(LanguageStorage.getCurrentLanguage())

    // 根据当前标签筛选词书
    const filterLexicons = () => {
      const filteredLexicons = allLexicons.value.filter((lexicon) => {
        // const matchesTab = activeTab.value === 'all' || lexicon.status === activeTab.value
        const matchesSearch = lexicon.bookName.toLowerCase().includes(searchQuery.value.toLowerCase())
        return /* matchesTab && */ matchesSearch
      })
      displayedLexicons.value = filteredLexicons.slice(0, currentLoad.value * lexiconsPerLoad)
    }

    // 获取词书数据
    const fetchLexicons = async () => {
      try {
        const data = await LexiconAPI.getAllLexicons()
        if (Array.isArray(data)) {
          // 根据当前选择的语言筛选词书
          allLexicons.value = data.filter(lexicon =>
            lexicon && lexicon.language === selectedLanguage.value.name.toLowerCase(),
          )
          filterLexicons()
        }
        else {
          throw new TypeError('Invalid data format')
        }
      }
      catch (error) {
        console.error('获取词书列表失败:', error)
        uni.showToast({
          title: '获取词书列表失败',
          icon: 'none',
          duration: 2000,
        })
      }
    }

    // 执行词书切换
    const switchLexicon = async (lexicon: Lexicon) => {
      uni.showModal({
        title: '📚 确认选择',
        content: `确定要选择「${lexicon.bookName}」作为您的词书吗？`,
        success: (res) => {
          if (res.confirm) {
            try {
              // 保存词书 id 和名称
              LexiconStorage.setCurrentLexicon({
                id: lexicon.id,
                name: lexicon.bookName,
              })

              // 延迟返回，确保提示显示完整
              uni.showToast({
                title: '🎉 选择成功！',
                icon: 'success',
                duration: 1500,
                success: () => {
                  setTimeout(() => {
                    uni.navigateBack()
                  }, 1500)
                },
              })
            }
            catch (error) {
              console.error('切换词书失败:', error)
              uni.showToast({
                title: '❌ 切换失败，请重试',
                icon: 'none',
              })
            }
          }
          else {
            uni.showToast({
              title: '👍 已取消选择',
              icon: 'none',
            })
          }
        },
      })
    }

    // 切换词书的处理函数
    const handleSwitchLexicon = async (lexicon: Lexicon) => {
      switchLexicon(lexicon)
    }

    // 初始化加载
    const initializeLexicons = async () => {
      await fetchLexicons()
      filterLexicons()
    }

    // 搜索功能
    const handleSearch = (event: UniHelper.InputOnInputEvent) => {
      searchQuery.value = event.detail.value
      currentLoad.value = 1
      filterLexicons()
    }

    const toggleSearch = () => {
      isSearchVisible.value = !isSearchVisible.value
      if (!isSearchVisible.value)
        searchQuery.value = ''
    }

    const onSearch = () => {
      if (searchQuery.value.trim()) {
        filterLexicons()
      }
      // toggleSearch() // 可选：是否在搜索后关闭搜索框
    }

    // 切换标签
    // const handleTabChange = (tab: 'all' | LexiconStatus) => {
    //   activeTab.value = tab
    //   currentLoad.value = 1
    //   filterLexicons()
    // }

    // 下拉刷新
    const onRefresh = async () => {
      isRefreshing.value = true
      await fetchLexicons()
      filterLexicons()
      isRefreshing.value = false
    }

    // 加载更多
    const onLoadMore = async () => {
      currentLoad.value++
      filterLexicons()
    }

    // 监听语言变化
    watch(() => LanguageStorage.getCurrentLanguage(), (newLanguage) => {
      selectedLanguage.value = newLanguage
      fetchLexicons() // 重新获取对应语言的词书
    })

    // 初始化
    initializeLexicons()

    return {
      activeTab, // 保留但不使用
      displayedLexicons,
      isRefreshing,
      handleSearch,
      // handleTabChange, // 保留但不使用
      handleSwitchLexicon,
      onRefresh,
      onLoadMore,
      isSearchVisible,
      toggleSearch,
      onSearch,
      searchQuery, // 添加这一行
    }
  },
})
</script>

<template>
  <view class="rounded p-4 shadow-sm frosted-glass">
    <view class="mb-4 flex items-center justify-between">
      <text class="text-xl font-bold">
        词库
      </text>
      <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="toggleSearch">
        <view class="i-mynaui:search text-2xl" />
      </view>
    </view>
  </view>

  <transition book-name="fade">
    <view v-if="isSearchVisible" class="animate-fadeIn fixed left-0 right-0 top-16 z-50 px-4 py-2 shadow-md frosted-glass">
      <view class="flex items-center">
        <view class="i-mynaui:search mr-2 text-xl text-gray-400" />
        <input
          :value="searchQuery"
          type="text"
          placeholder="搜索词书..."
          class="flex-1 bg-transparent text-base outline-none"
          @input="handleSearch"
          @keydown.enter="onSearch"
        >
        <view class="i-ci:close-md ml-2 cursor-pointer text-xl" @click="toggleSearch" />
      </view>
    </view>
  </transition>

  <!-- Tab栏 -->
  <!--
  <view class="flex border-b frosted-glass">
    <view
      v-for="tab in [
        { key: 'all', label: '全部' },
        { key: 'learning', label: '学习中' },
        { key: 'completed', label: '已完成' },
        { key: 'not-started', label: '未开始' },
      ]"
      :key="tab.key"
      class="flex-1 py-3 text-center"
      :class="{ 'border-b-2 border-yellow text-yellow': activeTab === tab.key }"
      @click="handleTabChange(tab.key as 'all' | LexiconStatus)"
    >
      {{ tab.label }}
    </view>
  </view>
  -->

  <!-- 词书列表 -->
  <scroll-view
    :scroll-y="true"
    refresher-enabled
    :refresher-triggered="isRefreshing"
    class="flex-1"
    :lower-threshold="50"
    @refresherrefresh="onRefresh"
    @scrolltolower="onLoadMore"
  >
    <view class="p-4">
      <LexiconBox
        v-for="lexicon in displayedLexicons"
        :key="lexicon.id"
        :name="lexicon.bookName"
        :description="lexicon.description"
        @click="handleSwitchLexicon(lexicon)"
      >
        <!-- :status="lexicon.status" -->
        />
      </lexiconbox>
    </view>
  </scroll-view>
</template>

<route lang="json">
{  "layout": "default"}
</route>

<style scoped>
.frosted-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out forwards;
}
</style>
