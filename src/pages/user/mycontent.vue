<script setup lang="ts">
</script>

<template>
  <view class="profile-page">
    <view class="header">
      <view class="help">
        <view class="i-mynaui:info-octagon" size="7" />
      </view>
    </view>
    <view class="links">
      <view class="box">
        <navigator url="/pages/user/mycontent" class="link">
          <view class="i-mynaui:book-open" />
          <text class="link-text">
            在学词书
          </text>
          <text class="link-text-right">
            5000
          </text>
          <view class="i-mynaui:chevron-right" />
        </navigator>
      </view>
      <view class="box">
        <navigator url="/pages/user/mydata" class="link">
          <view class="i-mynaui:book-check" />
          <text class="link-text">
            近日已学
          </text>
          <text class="link-text-right">
            5000
          </text>
          <view class="i-mynaui:chevron-right" />
        </navigator>
        <navigator url="/pages/user/mydata" class="link">
          <view class="i-mynaui:book-dot-solid" />
          <text class="link-text">
            全部已学
          </text>
          <text class="link-text-right">
            5000
          </text>
          <view class="i-mynaui:chevron-right" />
        </navigator>
      </view>

      <view class="box">
        <navigator url="/pages/user/settings" class="link">
          <view class="i-mynaui:album" />
          <text class="link-text">
            单词本&nbsp;&nbsp;&nbsp;&nbsp;
          </text>
          <text class="link-text-right">
            5000
          </text>
          <view class="i-mynaui:chevron-right" />
        </navigator>
        <navigator url="/pages/user/settings" class="link">
          <view class="i-mynaui:edit" />
          <text class="link-text">
            笔记&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </text>
          <text class="link-text-right">
            5000
          </text>
          <view class="i-mynaui:chevron-right" />
        </navigator>
      </view>
    </view>
  </view>
</template>

<style scoped>
.profile-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: rgba(0, 0, 57, 0.85);
}

.background-image {
  display: none; /* Hide the image element as the background is now set on the container */
}

.header {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 3rem;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

.username {
  margin-top: 0.5rem;
  font-size: 1.5rem;
  color: white;
}

.help {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  z-index: 2;
}

.links {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.box {
  width: 80%; /* Adjust the width as needed */
  background-color: rgba(0, 0, 0, 0.8); /* Increase opacity to 0.8 */
  border-radius: 0.3rem;
  margin: 1rem 0; /* Add some margin between the boxes */
  display: flex;
  flex-direction: column;
}

.link {
  display: flex; /* Use Flexbox for the link */
  justify-content: space-between; /* Distribute space between items */
  align-items: center; /* Center items vertically */
  padding-bottom: 0.8rem; /* Add some padding to the top and bottom */
  padding-top: 0.8rem;
  color: white;
  text-decoration: none;
  width: 100%; /* Ensure the link takes the full width */
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-sizing: border-box;
}

.link-text-right {
  margin-left: auto; /* Push the text to the right */
  margin-right: 0.1rem; /* Add some space between the text and the right edge */
}

[class^="i-mynaui:"]:not(.i-mynaui\:chevron-right) {
  margin-left: 0.8rem;
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
}

.link-text {
  margin-left: 0.3rem; /* Move the text to the right */
  margin-right: 6.5rem;
}
</style>
