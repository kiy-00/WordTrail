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
  // 获取学习单词
  getLearnWords: async (lexiconName: string): Promise<Word[]> => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${API_BASE_URL}/api/studyplan/learnwords/${lexiconName}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${uni.getStorageSync('authToken')}`,
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data as Word[])
          }
          else {
            reject(new Error('Failed to fetch words'))
          }
        },
        fail: reject,
      })
    })
  },

  // 获取复习单词
  getReviewWords: async (lexiconName: string): Promise<Word[]> => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${API_BASE_URL}/api/studyplan/reviewwords/${lexiconName}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${uni.getStorageSync('authToken')}`,
        },
        success: (res) => {
          if (res.statusCode === 200) {
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
        Authorization: `Bearer ${uni.getStorageSync('authToken')}`,
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
        Authorization: `Bearer ${uni.getStorageSync('authToken')}`,
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
        Authorization: `Bearer ${uni.getStorageSync('authToken')}`,
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
        Authorization: `Bearer ${uni.getStorageSync('authToken')}`,
      },
    })
    return response
  },
}
