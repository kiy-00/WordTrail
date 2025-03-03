import { API_BASE_URL } from '@/config/api'

export interface Phonetic {
  ipa: string
  audio: string
}

export interface PartOfSpeech {
  type: string
  exampleSentences: string[] | null
  gender: string[] | null
  pluralForms: string[] | null
  definitions: string | null // 添加这个字段
}

export interface Word {
  id: string
  word: string
  language: string
  category: string[] | null
  partOfSpeechList: PartOfSpeech[]
  phonetics: Phonetic[]
}

export interface WordResponse {
  words: Word[]
}

export interface FailedResponse {
  error: string
}

export const WordAPI = {
  getLearnWords: async (lexiconId: string): Promise<Word[]> => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `/word/api/studyplan/learnwords/${lexiconId}`, // 使用相对路径
        method: 'GET',
        header: {
          Authorization: uni.getStorageSync('token'),
        },
        success: (res) => {
          if (res.statusCode === 200) {
            if (Array.isArray(res.data)) {
              resolve(res.data as Word[])
            }
            else {
              reject(new Error('返回数据格式错误'))
            }
          }
          else {
            console.error('获取单词失败:', res.statusCode, res.data)
            reject(new Error(`获取单词失败: ${res.statusCode}`))
          }
        },
        fail: (error) => {
          console.error('请求发生错误:', error)
          reject(error)
        },
      })
    })
  },
  // 获取复习单词
  getReviewWords: async (lexiconId: string): Promise<Word[]> => {
    return new Promise((resolve, reject) => {
      uni.request({
        // 修改 URL 路径，使用词书名称而不是ID
        url: `${API_BASE_URL}/api/studyplan/reviewwords/${encodeURIComponent(lexiconId)}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${uni.getStorageSync('token')}`,
        },
        success: (res) => {
          if (res.statusCode === 200 && Array.isArray(res.data)) {
            resolve(res.data as Word[])
          }
          else {
            reject(new Error('Failed to fetch review words'))
          }
        },
        fail: reject,
      })
    })
  },

  // 获取学习进度
  getToLearnCount: async (lexiconName: string) => {
    const response = await uni.request({
      url: `${API_BASE_URL}/api/studyplan/learncount/${lexiconName}`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
      },
    })
    return response
  },

  // 获取复习进度
  getReviewCount: async (lexiconName: string) => {
    const response = await uni.request({
      url: `${API_BASE_URL}/api/studyplan/reviewcount/${lexiconName}`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
      },
    })
    return response
  },

  // 重置学习次数
  resetReviewCount: async (lexiconName: string, wordId: string) => {
    const response = await uni.request({
      url: `${API_BASE_URL}/api/studyplan/resetcount/${lexiconName}/${wordId}`,
      method: 'PUT',
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
      },
    })
    return response
  },

  // 减少学习次数
  decrementReviewCount: async (lexiconName: string, wordId: string) => {
    const response = await uni.request({
      url: `${API_BASE_URL}/api/studyplan/decrementcount/${lexiconName}/${wordId}`,
      method: 'PUT',
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
      },
    })
    return response
  },

  // 获取未学习单词总数
  getNewWordsCount: async (lexiconId: string): Promise<number> => {
    try {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userInfo')?.userId

      if (!token || !userId) {
        throw new Error('未登录或用户信息不完整')
      }

      const response = await uni.request({
        url: `${API_BASE_URL}/api/v1/learning/book/${lexiconId}/new-words-count?userId=${userId}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.statusCode === 200) {
        return (response.data as any).count || 0
      }
      else {
        throw new Error('获取未学习单词数量失败')
      }
    }
    catch (error) {
      console.error('获取未学习单词数量失败:', error)
      return 0
    }
  },

  // 获取今日需要复习的单词数量
  getTodayReviewCount: async (lexiconId: string): Promise<number> => {
    try {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userInfo')?.userId

      if (!token || !userId) {
        throw new Error('未登录或用户信息不完整')
      }

      const response = await uni.request({
        url: `${API_BASE_URL}/api/v1/learning/book/${lexiconId}/today-review-count?userId=${userId}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.statusCode === 200) {
        return (response.data as any).count || 0
      }
      else {
        throw new Error('获取待复习单词数量失败')
      }
    }
    catch (error) {
      console.error('获取待复习单词数量失败:', error)
      return 0
    }
  },
}
