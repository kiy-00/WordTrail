<!-- Comments.vue -->
<script lang="ts">
import { defineComponent } from 'vue'
import CommentsCard from './CommentsCard.vue'

interface Comment {
  id: number
  username: string
  avatar: string
  content: string
  publishTime: string
  likes: number
  dislikes: number
  replies?: Comment[]
}

export default defineComponent({
  name: 'Comments',
  components: {
    CommentsCard,
  },
  props: {
    comment: {
      type: Object as () => Comment,
      required: true,
    },
  },
  setup() {
    return {}
  },
})
</script>

<template>
  <view class="mb-4 border-white border-b-dashed pb-4">
    <!-- 主评论 -->
    <CommentsCard :comment="comment" :root-comment="comment" />

    <!-- 渲染主评论的所有回复 -->
    <view v-for="reply in comment.replies" :key="reply.id">
      <CommentsCard :comment="reply" :root-comment="comment" />
    </view>
  </view>
</template>

<style scoped>
/* 使用 UnoCSS 进行样式化，不需要额外的 CSS */
</style>
