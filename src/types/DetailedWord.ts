// types/DetailedWord.ts
export interface DetailedPhonetic {
  ipa: string
  audio: string
}

export interface Example {
  sentence: string
  translation: string
}

export interface DetailedPartOfSpeech {
  type: string
  definitions: string[] // 定义一定是字符串数组
  exampleSentences?: Array<Example> | null
  examples?: Array<Example> | null // 添加新字段，适配后端返回的格式
  gender?: string | null
  plural?: string | null // 增加 plural 直接字段
  pluralForms?: string[] | null
}

export interface DetailedWord {
  id?: string
  _id?: { timestamp: number, date: string }
  word: string
  language: string
  category?: string[] | null
  partOfSpeechList: DetailedPartOfSpeech[]
  phonetics: DetailedPhonetic[]
  exampleSentence?: string
  exampleTranslation?: string
  synonyms?: string[]
  antonyms?: string[]
  difficulty?: number
  tags?: string[]
}
