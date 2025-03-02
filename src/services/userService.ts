import { API_BASE_URL } from '@/config/api'

export interface UserDetail {
  userId: string
  username: string
  email: string
  phone: string | null
  avatarUrl: string | null
  active: boolean
  createTime: string
  updateTime: string
}

/**
 * 根据用户ID获取用户详细信息
 * @param userId 用户ID
 * @returns 用户详情对象
 */
export async function getUserDetailById(userId: string): Promise<UserDetail> {
  try {
    const token = uni.getStorageSync('token')

    const response = await uni.request({
      url: `${API_BASE_URL}/api/v1/auth/user/${userId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.statusCode === 200 && response.data) {
      return response.data as UserDetail
    }

    throw new Error(`获取用户信息失败: ${response.statusCode}`)
  }
  catch (error) {
    console.error('获取用户信息失败:', error)
    throw new Error('Failed to fetch user details')
  }
}
