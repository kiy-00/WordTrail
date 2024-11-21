<script>
</script>

<template>
  <view class="profile-page">
    <view class="header">
      <image class="background-image" src="@/static/background/img.png" />
      <view class="avatar-container">
        <image class="avatar" src="@/static/avatar/avatar.png" />
        <text class="username">
          username
        </text>
      </view>
      <view class="notification">
        <view class="i-mynaui:envelope" color-white size="5" />
        <text class="notification-count">
          3
        </text>
      </view>
    </view>
    <view class="links">
      <view class="box">
        <navigator url="/pages/user/mydata" class="link">
          <view class="i-mynaui:image-circle" />
          <text class="link-text">
            外观设置
          </text>
        </navigator>
        <navigator url="/pages/user/mycontent" class="link">
          <view class="i-mynaui:config-vertical" />
          <text class="link-text">
            学习设置
          </text>
        </navigator>
        <navigator url="/pages/user/settings" class="link">
          <view class="i-mynaui:tool" />
          <text class="link-text">
            更多设置
          </text>
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
  background-image: url('@/static/background/img.png');
  background-size: cover;
  background-position: center;
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

.notification {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  z-index: 2;
}

.i-mynaui\:envelope {
  margin-right: 0.4rem;
}

.notification-count {
  color: white;
}

.links {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.box {
  width: 80%; /* Adjust the width as needed */
  background-color: rgba(0, 0, 0, 0.8); /* Increase opacity to 0.8 */
  border-radius: 0.3rem;
  margin: 15% auto; /* Center the box horizontally */
  display: flex;
  flex-direction: column;
}

.link {
  flex-grow: 1; /* Make each link take equal height */
  flex-basis: 0; /* Ensure the links grow equally */
  color: white;
  text-decoration: none;
  width: 100%; /* Ensure the link takes the full width */
  border-bottom: 1px solid rgba(255, 255, 255, 0.3); /* Add a bottom border as a separator */
  padding: 0.8rem 0 0.8rem 0; /* Add some padding to the top and bottom */
  display: flex; /* Use Flexbox for the link */
}

.link:last-child {
  border-bottom: none; /* Remove the bottom border for the last link */
}

[class^="i-mynaui:"]:not(.i-mynaui\:envelope) {
  margin-left: 1rem;
  margin-right: 0.2rem; /* Add some space between the icon and the text */
  margin-bottom: 0.23rem;
}

.link-text {
  margin-bottom: 20px;
  margin-left: 0.5rem; /* Move the text to the right */
}
</style>
