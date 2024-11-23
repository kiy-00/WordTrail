<!-- CommunityHeader.vue -->
<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'CommunityHeader',
  emits: {
    'back': () => true,
    'tab-change': (tab: 'recommend' | 'my' | 'favorites') => ['recommend', 'my', 'favorites'].includes(tab),
    'search': (query: string) => typeof query === 'string' && query.trim().length > 0,
  },
  setup(_, { emit }) {
    const activeTab = ref<'recommend' | 'my' | 'favorites'>('recommend')
    const isSearchVisible = ref(false)
    const searchQuery = ref('')

    const onBack = () => {
      emit('back')
    }

    const selectTab = (tab: 'recommend' | 'my' | 'favorites') => {
      if (activeTab.value !== tab) {
        activeTab.value = tab
        emit('tab-change', tab)
      }
    }

    const toggleSearch = () => {
      isSearchVisible.value = !isSearchVisible.value
      if (!isSearchVisible.value) {
        searchQuery.value = ''
      }
    }

    const onSearch = () => {
      if (searchQuery.value.trim()) {
        emit('search', searchQuery.value.trim())
      }
      toggleSearch()
    }

    return {
      activeTab,
      isSearchVisible,
      searchQuery,
      onBack,
      selectTab,
      toggleSearch,
      onSearch,
    }
  },
})
</script>

<template>
  <view class="relative h-12 flex items-center justify-between border-b border-gray-300 px-4 frosted-glass">
    <!-- 左侧返回按钮 -->
    <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="onBack">
      <view class="i-mynaui:arrow-left text-2xl" />
    </view>

    <!-- 中部标签 -->
    <view class="flex flex-1 justify-center">
      <view
        class="relative mx-2 cursor-pointer text-base tab"
        :class="activeTab === 'recommend' ? 'text-yellow font-bold' : ''"
        @click="selectTab('recommend')"
      >
        推荐
        <view
          v-if="activeTab === 'recommend'"
          class="absolute bottom-[-5px] left-1/2 h-0.5 w-5 transform bg-yellow -translate-x-1/2"
        />
      </view>
      <view
        class="relative mx-2 cursor-pointer text-base tab"
        :class="activeTab === 'my' ? 'text-yellow font-bold' : ''"
        @click="selectTab('my')"
      >
        我的
        <view
          v-if="activeTab === 'my'"
          class="absolute bottom-[-5px] left-1/2 h-0.5 w-5 transform bg-yellow -translate-x-1/2"
        />
      </view>
      <!-- 新增 收藏 选项卡 -->
      <view
        class="relative mx-2 cursor-pointer text-base tab"
        :class="activeTab === 'favorites' ? 'text-yellow font-bold' : ''"
        @click="selectTab('favorites')"
      >
        收藏
        <view
          v-if="activeTab === 'favorites'"
          class="absolute bottom-[-5px] left-1/2 h-0.5 w-5 transform bg-yellow -translate-x-1/2"
        />
      </view>
    </view>

    <!-- 右侧搜索按钮 -->
    <view class="h-6 w-6 flex cursor-pointer items-center justify-center" @click="toggleSearch">
      <view class="i-mynaui:search text-2xl" />
    </view>
  </view>
  <transition name="fade">
    <view v-if="isSearchVisible" class="animate-fadeIn fixed left-0 right-0 top-20 z-1000 px-4 frosted-glass">
      <view class="flex items-center p-2">
        <view class="i-mynaui:search mr-2 text-xl" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索..."
          class="flex-1 rounded-sm bg-transparent text-base outline-none"
          @keydown.enter="onSearch"
        >
        <view class="i-ci:close-md ml-2 cursor-pointer text-xl" @click="toggleSearch" />
      </view>
    </view>
  </transition>
</template>

<style scoped>
/* UnoCSS handles all styling using utility classes */
/* Add custom animations using UnoCSS */

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
