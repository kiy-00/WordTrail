<!-- Comments.vue -->
<script lang="ts">
import type { Comment } from '@/types/Comment'
import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import CommentsCard from './CommentsCard.vue'

export default defineComponent({
  name: 'Comments',
  components: {
    CommentsCard,
  },
  props: {
    comment: {
      type: Object as PropType<Comment>,
      required: true,
    },
  },
})
</script>

<template>
  <view class="mb-4 border-white border-b-dashed pb-4">
    <!-- 主评论 -->
    <CommentsCard :comment="comment" :root-comment="comment" />

    <!-- 渲染主评论的所有回复 -->
    <view
      v-for="reply in comment.replies"
      :key="reply.id"
      class="ml-8"
    >
      <CommentsCard
        :comment="reply"
        :root-comment="comment"
        :parent-username="comment.username"
      />
    </view>
  </view>
</template>

<style scoped>
/* 使用 UnoCSS 进行样式化，不需要额外的 CSS */
</style>
