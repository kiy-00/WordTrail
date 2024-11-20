<script lang="ts">
export default defineComponent({
  name: 'CommunityHeader',
  emits: {
    'back': () => true,
    'tab-change': (tab: 'recommend' | 'my') => ['recommend', 'my'].includes(tab),
    'search': (query: string) => typeof query === 'string' && query.trim().length > 0,
  },
  setup(_, { emit }) {
    const activeTab = ref<'recommend' | 'my'>('recommend')
    const isSearchVisible = ref(false)
    const searchQuery = ref('')

    const onBack = () => {
      emit('back')
    }

    const selectTab = (tab: 'recommend' | 'my') => {
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
  <view class="header">
    <!-- 左侧返回按钮 -->
    <view class="header-left" @click="onBack">
      <uni-icon type="left" size="24" />
    </view>

    <!-- 中部标签 -->
    <view class="header-middle">
      <view
        class="tab"
        :class="{ active: activeTab === 'recommend' }"
        @click="selectTab('recommend')"
      >
        推荐
      </view>
      <view
        class="tab"
        :class="{ active: activeTab === 'my' }"
        @click="selectTab('my')"
      >
        我的
      </view>
    </view>

    <!-- 右侧搜索按钮 -->
    <view class="header-right" @click="toggleSearch">
      <uni-icon type="search" size="24" />
    </view>

    <!-- 搜索框 -->
    <transition name="fade">
      <view v-if="isSearchVisible" class="search-container">
        <view class="search-box">
          <uni-icon type="search" size="20" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索..."
            class="search-input"
            @keydown.enter="onSearch"
          >
          <uni-icon
            type="close"
            size="20"
            class="close-icon"
            @click="toggleSearch"
          />
        </view>
      </view>
    </transition>
  </view>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 50px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
}

/* 左右按钮的大小保持一致 */
.header-left,
.header-right {
  width: 24px;
  height: 24px;
}

.header-middle {
  display: flex;
  flex: 1;
  justify-content: center;
}

.tab {
  margin: 0 1rem;
  font-size: 16px;
  color: #888888;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: #000000;
  font-weight: bold;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #000000;
}

.search-container {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  padding: 0 1rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  animation: fadeIn 0.3s ease-in-out;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 0.5rem;
}

.search-icon {
  margin-right: 0.5rem;
  color: #888888;
}

.close-icon {
  margin-left: 0.5rem;
  color: #888888;
  cursor: pointer;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #000000;
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

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
