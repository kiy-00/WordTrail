<script lang="ts">
export default defineComponent({
  name: 'Home',
  setup() {
    const selectedLanguage = ref<string>('English')
    const languages = ref<string[]>(['English', 'Spanish', 'French', 'German', 'Chinese'])

    return {
      selectedLanguage,
      languages,

    }
  },
})
</script>

<template>
  <view class="header">
    <image class="avatar" src="@/static/avatar/avatar.png" alt="User Avatar" />
    <picker v-model="selectedLanguage" mode="selector" :range="languages" class="language-select">
      <view>{{ selectedLanguage }}</view>
    </picker>
  </view>
  <view class="main-content">
    <!-- 日历组件占位 -->
    <!-- <view>
      <uni-calendar
        :insert="true"
        :lunar="true"
        start-date="2019-3-2"
        end-date="2019-5-20"
      />
    </view> -->
  </view>
  <view class="footer">
    <view class="buttons">
      <button class="learn-button">
        Learn
      </button>
      <button class="review-button">
        Review
      </button>
    </view>
    <TabBar />
  </view>
</template>

<style scoped>
:root {
  font-size: 16px; /* 基础字体大小 */
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem; /* 使用 rem 单位 */
}

.avatar {
  width: 3.125rem; /* 50px 转换为 rem */
  height: 3.125rem; /* 50px 转换为 rem */
  border-radius: 50%;
}

.language-select {
  margin-left: 0.625rem; /* 10px 转换为 rem */
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons {
  display: flex;
  width: 80%;
  justify-content: space-between;
  margin-bottom: 0.625rem; /* 10px 转换为 rem */
}

.learn-button,
.review-button {
  width: 48%;
  padding: 0.625rem; /* 10px 转换为 rem */
  font-size: 1rem; /* 使用 rem 单位 */
}

@media (max-width: 600px) {
  .learn-button,
  .review-button {
    font-size: 0.875rem; /* 针对小屏幕调整字体大小 */
  }
}
</style>
