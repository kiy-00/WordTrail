<script lang="ts">
import type { PropType } from 'vue'
import { useRouter } from 'vue-router'

interface Post {
  id: number
  title: string
  likes: number
  publishTime: string
  username: string
  userAvatar: string
  images?: string[] // 可选的图片数组
}

export default defineComponent({
  name: 'PostCard',
  props: {
    post: {
      type: Object as PropType<Post>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()

    const navigateToDetail = () => {
      router.push({ name: 'PostDetail', params: { id: props.post.id } })
    }

    return {
      navigateToDetail,
    }
  },
})
</script>

<template>
  <view class="post-card" @click="navigateToDetail">
    <!-- 帖子头部 -->
    <view class="post-header">
      <image :src="post.userAvatar" class="avatar" />
      <view class="user-info">
        <text class="username">
          {{ post.username }}
        </text>
        <text class="publish-time">
          {{ post.publishTime }}
        </text>
      </view>
    </view>

    <!-- 帖子内容 -->
    <view class="post-content">
      <text class="title">
        {{ post.title }}
      </text>
      <!-- 显示第一张图片 -->
      <image
        v-if="post.images && post.images.length > 0"
        :src="post.images[0]"
        class="post-image"
        mode="aspectFill"
      />
    </view>

    <!-- 帖子底部 -->
    <view class="post-footer">
      <uni-icons type="heart" size="20" color="#ff0000" />
      <text class="likes">
        {{ post.likes }} 点赞
      </text>
    </view>
  </view>
</template>

<style scoped>
.post-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #fff;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.user-info {
  margin-left: 0.5rem;
}

.username {
  font-weight: bold;
  font-size: 16px;
}

.publish-time {
  font-size: 12px;
  color: #888;
}

.post-content {
  margin-bottom: 0.5rem;
}

.title {
  font-size: 18px;
  color: #333;
  margin-bottom: 0.5rem;
}

.post-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  margin-top: 0.5rem;
}

.post-footer {
  display: flex;
  align-items: center;
}

.likes {
  margin-left: 0.25rem;
  font-size: 14px;
  color: #ff0000;
}
</style>
