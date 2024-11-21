<script lang="ts">
export default {
  props: {
    currentCard: {
      type: Number,
      default: 0,
    },
    totalCards: {
      type: Number,
      default: 10,
    },
  },
  methods: {
    onBack() {
      uni.navigateBack({
        delta: 1,
      })
    },
    onCollect() {
      // eslint-disable-next-line no-alert
      alert('Collect button clicked')
      // Placeholder for collect functionality
    },
    onDelete() {
      // eslint-disable-next-line no-alert
      alert('Delete button clicked')
      // Placeholder for delete functionality
    },
    onMoreInfo() {
      // eslint-disable-next-line no-alert
      alert('More-info button clicked')
      // Placeholder for more-info functionality
    },
  },
}
</script>

<template>
  <view class="header">
    <view class="header-left">
      <view class="icon-container" @click="onBack">
        <Icon icon="mynaui:arrow-left" class="icon" />
      </view>
      <text class="progress">
        {{ currentCard }} / {{ totalCards }}
      </text>
    </view>

    <view class="header-right">
      <view class="icon-container" @click="onCollect">
        <Icon icon="mynaui:star" class="icon" />
      </view>
      <view class="icon-container" @click="onDelete">
        <Icon icon="mynaui:trash" class="icon" />
      </view>
      <view class="icon-container" @click="onMoreInfo">
        <Icon icon="mynaui:dots" class="icon" />
      </view>
    </view>
  </view>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  height: 50px;
  width: 100%;
  padding-top: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px; /* Space between icons */
  margin-left: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px; /* Space between icons */
  margin-right: 20px;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon {
  font-size: 24px;
  color: white; /* Icon color */
}

.progress {
  font-family: Arial, sans-serif;
  font-size: 16px;
  color: white;
  flex: 1;
}
</style>
