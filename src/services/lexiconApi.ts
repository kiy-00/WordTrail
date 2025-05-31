export interface WordbookDetail {
  id: string
  bookName: string
  description: string
  language: string
  createUser: string
  words: string[]
}

export interface WordDetail {
  word: string
  difficulty: number
  partOfSpeechList: {
    type: string
    definitions: string[]
  }[]
  synonyms: string[]
  antonyms: string[]
  tags: string[]
}

export default {
  getWordbook: async (id: string): Promise<WordbookDetail> => {
    const response = await uni.request({
      url: `/api/v1/system-wordbooks/${id}`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
      },
    })
    if (typeof response.data === 'object' && response.data !== null)
      return response.data as WordbookDetail
    throw new Error('Invalid response data')
  },

  getWord: async (id: string): Promise<WordDetail> => {
    const response = await uni.request({
      url: `/api/v1/words/${id}`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
      },
    })
    if (typeof response.data === 'object' && response.data !== null)
      return response.data as WordDetail
    throw new Error('Invalid response data')
  },
}
