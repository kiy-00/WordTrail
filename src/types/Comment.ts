export interface Comment {
  id: number
  username: string // 用户名
  avatar: string // 头像
  content: string // 评论内容
  publishTime: string // 发布时间
  likes: number // 点赞数
  dislikes: number // 点踩数
  replies?: Comment[] // 回复列表
  parentUsername?: string // 被回复者的用户名
  isMyComment?: boolean // 是否是自己的评论
  nickName?: string // 昵称
  parentComment?: number // 父评论ID
  deleted?: boolean // 是否已删除
  replyToId?: number // 回复目标ID
  replyToName?: string // 回复目标用户名
}
