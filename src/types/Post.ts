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
  id: number
  title: string
  content: string
  publishTime: string
  username: string
  userAvatar: string
  images?: string[]
  tags?: string[]
  likes: number
  collects?: number
  status?: '审核中' | '已发布' | '被举报' // 新增状态字段
}
