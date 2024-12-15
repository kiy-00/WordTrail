import { API_BASE_URL } from '@/config/api'

export interface Lexicon {
  id: string
  language: string
  bookName: string
  description: string
  createUser: string
  words: string[]
  wordCount: number
}

export interface LexiconInfo {
  id: number
  name: string
  status: 'learning' | 'completed' | 'not-started'
  total: number
  learned: number
}

export interface LexiconResponse {
  data: LexiconInfo[]
  message?: string
}

export interface LexiconError {
  error: string
}

export const LexiconAPI = {
  // 获取用户词书信息
  getUserLexicons: async () => {
    return new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
      uni.request({
        url: '/api/lexicon',
        method: 'GET',
        header: {
          Authorization: `Bearer ${uni.getStorageSync('authToken')}`,
        },
        success: resolve,
        fail: reject,
      })
    })
  },

  // 获取所有系统词书列表
  getAllLexicons: () => {
    return new Promise<Lexicon[]>((resolve, reject) => {
      uni.request({
        url: `${API_BASE_URL}/books`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${uni.getStorageSync('authToken')}`,
          'Content-Type': 'application/json',
        },
        success: (res: UniApp.RequestSuccessCallbackResult) => {
          if (res.statusCode === 200 && Array.isArray(res.data)) {
            resolve(res.data as Lexicon[])
          }
          else {
            reject(new Error('Invalid response format'))
          }
        },
        fail: (err) => {
          reject(new Error(`Request failed: ${err.errMsg}`))
        },
      })
    })
  },
}
