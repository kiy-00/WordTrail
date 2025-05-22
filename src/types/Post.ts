// src/types/Post.ts

// 从独立的 Comment 类型定义文件导入
import type { Comment } from './Comment'

// 导出 Comment 类型以保持兼容性
export type { Comment }

export interface Post {
  id: string | number
  title: string
  content: string
  publishTime: string
  username: string
  userAvatar: string
  images: string[]
  likes: number
  commentCount?: number
  collects?: number
  state?: string
}
