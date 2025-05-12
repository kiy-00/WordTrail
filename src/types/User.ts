export interface UserInfo {
  id: string // 接口保持一致性
  username: string
  email?: string // 可选字段，因为可能没有
}

// 添加类型检查函数 - 调整以匹配实际存储数据结构
function isUserInfo(data: any): data is UserInfo {
  return (
    typeof data === 'object'
    && data !== null
    && (typeof data.id === 'string' || typeof data.userId === 'string') // 支持id或userId
    && typeof data.username === 'string'
  )
}

export async function getUserInfo(): Promise<UserInfo> {
  const cachedUserInfo = uni.getStorageSync('userInfo') || uni.getStorageSync('user')
  // eslint-disable-next-line no-console
  console.log('从storage获取的用户信息:', cachedUserInfo)

  // 如果本地已存储用户信息，直接返回
  if (cachedUserInfo && isUserInfo(cachedUserInfo)) {
    // 处理字段名差异
    return {
      id: cachedUserInfo.id,
      username: cachedUserInfo.username,
      email: cachedUserInfo.email,
    }
  }

  // 如果没有缓存用户信息，但有userId和username
  const userId = uni.getStorageSync('userId')
  const username = uni.getStorageSync('username')

  if (userId && username) {
    const userInfo = { id: userId, username }
    uni.setStorageSync('userInfo', userInfo)
    return userInfo
  }

  // 如果连userId和username都没有，则检查token中是否包含信息
  try {
    const token = uni.getStorageSync('token')
    // eslint-disable-next-line no-console
    console.log('从storage获取的token:', token)

    if (token) {
      // 尝试从token中提取用户信息（如果是JWT）
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(decodeURIComponent(escape(atob(base64))))

        if (payload.userId || payload.sub) {
          const userInfo = {
            id: payload.userId || payload.sub,
            username: payload.sub || 'user',
          }
          uni.setStorageSync('userInfo', userInfo)
          return userInfo
        }
      }
      catch (e) {
        console.error('解析token失败:', e)
      }
    }

    throw new Error('未登录')
  }
  catch (error) {
    console.error('获取用户信息失败:', error)
    throw new Error('Failed to fetch user info')
  }
}

export function isLoggedIn(): boolean {
  const token = uni.getStorageSync('token')
  // eslint-disable-next-line no-console
  console.log('检查登录状态, token:', token)
  return !!token
}
