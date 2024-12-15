export interface UserInfo {
  username: string
  avatar?: string
  // 后续可以添加更多用户信息字段
}

export const UserStorage = {
  getCurrentUser(): UserInfo | null {
    try {
      const userInfo = uni.getStorageSync('userInfo')
      return userInfo ? JSON.parse(userInfo) : null
    }
    catch {
      return null
    }
  },

  setUserInfo(userInfo: UserInfo): void {
    try {
      uni.setStorageSync('userInfo', JSON.stringify(userInfo))
    }
    catch (error) {
      console.error('保存用户信息失败:', error)
    }
  },

  clearUserInfo(): void {
    uni.removeStorageSync('userInfo')
  },
}
