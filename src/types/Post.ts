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
