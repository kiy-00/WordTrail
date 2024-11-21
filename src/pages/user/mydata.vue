<script setup lang="ts">

</script>

<template>
  <view />
  <view class="dashboard-page">
    <view class="header">
      <text class="header-text">
        Dashboard
      </text>
    </view>
    <view class="body-head">
      <text>正在学习</text>
      <button class="action-button">
        Action
      </button>
    </view>
    <view class="content">
      <view class="box">
        <image class="box-image" src="@/static/vite.png" />
        <text class="box-text">
          Text 1
        </text>
        <view class="learned">
          <uni-icons type="star" size="24" color="white" />
          <text class="box-text">
            Text 2
          </text>
        </view>
        <text class="box-text">
          Text 3
        </text>
        <text class="box-text">
          Text 4
        </text>
        <progress class="box-progress" value="50" max="100" />
      </view>
      <text>我的数据</text>
      <view class="box">
        <text class="box-text">
          Box 2 Content
        </text>
      </view>
      <view class="box">
        <text class="box-text">
          日历
        </text>
        <text class="box-text">
          连续签到{{ checkDays }}天
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 57, 0.85);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-content: center;
  width: 100%;
}

.body-head {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Center items vertically */
  width: 100%;
  padding: 1rem; /* Add some padding if needed */
}

.header-text {
  font-size: 1.5rem;
}

.action-button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 1rem;
}
.box {
  width: 80%; /* Adjust the width as needed */
  background-color: rgba(0, 0, 0, 0.8); /* Increase opacity to 0.8 */
  border-radius: 0.3rem;
  margin: 1rem 0; /* Add some margin between the boxes */
  display: flex;
  flex-direction: column;
}

.box-text {
  font-size: 1rem;
}

.footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  background-color: #333;
  color: white;
}

.footer-text-left,
.footer-text-right {
  font-size: 1rem;
}
</style>
