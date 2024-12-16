import type { UserInfo } from '@/types/User'

const USER_INFO_KEY = 'user_info'

export const UserStorage = {
  getCurrentUser(): UserInfo | null {
    const userInfo = uni.getStorageSync(USER_INFO_KEY)
    return userInfo ? JSON.parse(userInfo) : null
  },

  setCurrentUser(user: UserInfo): void {
    // 只存储需要的信息
    const userToStore = {
      userId: user.userId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      email: user.email,
      status: user.status,
      createTime: user.createTime,
    }
    uni.setStorageSync(USER_INFO_KEY, JSON.stringify(userToStore))
  },

  clearCurrentUser(): void {
    uni.removeStorageSync(USER_INFO_KEY)
  },

  isUserBanned(): boolean {
    const user = this.getCurrentUser()
    return user?.status === 1
  },
}
