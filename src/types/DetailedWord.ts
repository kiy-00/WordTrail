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
  definitions: string[] // 定义是字符串数组
  exampleSentences?: Array<Example> | null
  examples?: Array<Example> | null // 添加新字段，适配后端返回的格式
  gender?: string | null
  plural?: string | null
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
  synonyms?: string[] // 添加同义词字段
  antonyms?: string[] // 添加反义词字段
  difficulty?: number // 添加难度字段
  tags?: string[] // 添加标签字段
}
