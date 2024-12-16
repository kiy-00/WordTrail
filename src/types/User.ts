import { API_BASE_URL } from '@/config/api'

export interface UserInfo {
  id: string
  username: string
  email: string
}

// 添加类型检查函数
function isUserInfo(data: any): data is UserInfo {
  return (
    typeof data === 'object'
    && data !== null
    && typeof data.id === 'string'
    && typeof data.username === 'string'
    && typeof data.email === 'string'
  )
}

export async function getUserInfo(): Promise<UserInfo> {
  const cachedUserInfo = uni.getStorageSync('userInfo')
  // eslint-disable-next-line no-console
  console.log('从storage获取的用户信息:', cachedUserInfo)

  if (cachedUserInfo && isUserInfo(cachedUserInfo)) {
    return cachedUserInfo
  }

  // 如果本地没有，则从服务器获取
  try {
    const token = uni.getStorageSync('token')
    // eslint-disable-next-line no-console
    console.log('从storage获取的token:', token)

    const response = await uni.request({
      url: `${API_BASE_URL}/user/info`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${token}`,
      },
    })

    // eslint-disable-next-line no-console
    console.log('服务器返回的用户信息:', response)

    if (response.statusCode === 200 && response.data) {
      const userData = response.data
      if (!isUserInfo(userData)) {
        throw new Error('Invalid user data format')
      }
      uni.setStorageSync('userInfo', userData)
      return userData
    }

    console.error('获取用户信息失败, 状态码:', response.statusCode)
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
