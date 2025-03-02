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

export interface SystemWordbook {
  id: string
  bookName: string
  description: string
  language: string
  createUser: string
  words: string[]
}

export interface PageableSort {
  empty: boolean
  sorted: boolean
  unsorted: boolean
}

export interface WordbooksResponse {
  content: SystemWordbook[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: PageableSort
  }
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  empty: boolean
}

export const LexiconAPI = {
  // 获取用户词书信息
  getUserLexicons: async () => {
    return new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
      uni.request({
        url: `${API_BASE_URL}/api/lexicon`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${uni.getStorageSync('token')}`,
        },
        success: resolve,
        fail: reject,
      })
    })
  },

  // 修改获取词书列表的方法
  getAllLexicons: () => {
    return new Promise<Lexicon[]>((resolve, reject) => {
      const token = uni.getStorageSync('token')
      if (!token) {
        reject(new Error('No token found'))
        return
      }

      uni.request({
        url: `${API_BASE_URL}/books`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        success: (res: UniApp.RequestSuccessCallbackResult) => {
          if (res.statusCode === 403) {
            uni.redirectTo({ url: '/pages/user/login' })
            reject(new Error('Authentication failed'))
            return
          }

          if (res.statusCode === 200 && Array.isArray(res.data)) {
            resolve(res.data as Lexicon[])
          }
          else {
            reject(new Error('Invalid response format'))
          }
        },
        fail: (err) => {
          console.error('Request failed:', err)
          reject(new Error(`Request failed: ${err.errMsg}`))
        },
      })
    })
  },
  selectLexicon: (bookId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${API_BASE_URL}/api/lexicon/select`,
        method: 'POST',
        header: { Authorization: `Bearer ${uni.getStorageSync('token')}` },
        data: { bookId },
        success: (res) => {
          if (res.statusCode === 200) {
            // 后端成功返回：{ "message": "Book selected successfully" }
            resolve(res.data)
            console.error('Book selected successfully')
          }
          else {
            // 后端返回失败信息： { "error": "..." }
            reject(new Error('Failed to select book'))
          }
        },
        fail: (err) => {
          reject(new Error(`Network error or request failed: ${err.errMsg}`))
        },
      })
    })
  },
}
