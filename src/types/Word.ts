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

// 为WordDetail创建一个更详细的PartOfSpeech接口
export interface DetailedPartOfSpeech {
  type: string
  exampleSentences: string[] | null
  gender: string[] | null
  pluralForms: string[] | null
  definitions: string[] // 在详情中，definitions是字符串数组
  examples?: Array<{
    sentence: string
    translation: string
  }>
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

// 添加学习进度记录接口
export interface LearningProgress {
  id: string
  userId: string
  wordId: string
  proficiency: number
  lastReviewTime: string
  firstLearnTime: string
  nextReviewTime: string
  reviewStage: number
  reviewHistory: Array<{
    reviewTime: string | null
    remembered: boolean
  }>
}

// 修改单词详情接口，使用新的DetailedPartOfSpeech接口
export interface WordDetail extends Omit<Word, 'partOfSpeechList'> {
  difficulty: number
  synonyms: string[]
  antonyms: string[]
  tags: string[]
  partOfSpeechList: DetailedPartOfSpeech[] // 使用更详细的接口
}

export const WordAPI = {

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

  // 获取熟悉的单词
  getFamiliarWords: async (lexiconId: string): Promise<LearningProgress[]> => {
    try {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userInfo')?.userId

      if (!token || !userId) {
        throw new Error('未登录或用户信息不完整')
      }

      const response = await uni.request({
        url: `${API_BASE_URL}/api/v1/learning/book/${lexiconId}/familiar-words?userId=${userId}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        return response.data as LearningProgress[]
      }
      else {
        throw new Error('获取熟悉单词失败')
      }
    }
    catch (error) {
      console.error('获取熟悉单词失败:', error)
      return []
    }
  },

  // 获取模糊的单词
  getFuzzyWords: async (lexiconId: string): Promise<LearningProgress[]> => {
    try {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userInfo')?.userId

      if (!token || !userId) {
        throw new Error('未登录或用户信息不完整')
      }

      const response = await uni.request({
        url: `${API_BASE_URL}/api/v1/learning/book/${lexiconId}/fuzzy-words?userId=${userId}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        return response.data as LearningProgress[]
      }
      else {
        throw new Error('获取模糊单词失败')
      }
    }
    catch (error) {
      console.error('获取模糊单词失败:', error)
      return []
    }
  },

  // 获取未学习的单词
  getUnlearnedWords: async (lexiconId: string): Promise<LearningProgress[]> => {
    try {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userInfo')?.userId

      if (!token || !userId) {
        throw new Error('未登录或用户信息不完整')
      }

      const response = await uni.request({
        url: `${API_BASE_URL}/api/v1/learning/book/${lexiconId}/unlearned-words?userId=${userId}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        return response.data as LearningProgress[]
      }
      else {
        throw new Error('获取未学习单词失败')
      }
    }
    catch (error) {
      console.error('获取未学习单词失败:', error)
      return []
    }
  },

  // 获取单词详情
  getWordDetail: async (wordId: string): Promise<WordDetail | null> => {
    try {
      const token = uni.getStorageSync('token')

      if (!token) {
        throw new Error('未登录')
      }

      const response = await uni.request({
        url: `${API_BASE_URL}/api/v1/words/${wordId}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.statusCode === 200 && response.data) {
        return response.data as WordDetail
      }
      else {
        throw new Error('获取单词详情失败')
      }
    }
    catch (error) {
      console.error('获取单词详情失败:', error)
      return null
    }
  },
}
