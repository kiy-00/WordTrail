// src/types/Post.ts

export interface Comment {
  id: number
  username: string
  avatar: string
  content: string
  publishTime: string
  likes: number

  dislikes: number
  replies?: Comment[]
  parentUsername?: string
}

export interface Post {
  id: number // 保持为 number 类型
  title: string
  content: string
  publishTime: string
  username: string
  userAvatar: string
  images: string[]
  tags: string[]
  likes: number
  commentCount?: number
  collects?: number
  status?: string
}
