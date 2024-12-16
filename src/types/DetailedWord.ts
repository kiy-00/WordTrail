// types/DetailedWord.ts
export interface DetailedPhonetic {
  ipa: string
  audio: string
}

export interface DetailedPartOfSpeech {
  type: string
  definitions: string[] | null // 修改为数组类型
  exampleSentences?: string[] | null
  gender?: string[] | null
  pluralForms?: string[] | null
}

export interface DetailedWord {
  id: string
  word: string
  language: string
  category?: string[] | null
  partOfSpeechList: DetailedPartOfSpeech[]
  phonetics: DetailedPhonetic[]
  exampleSentence?: string
  exampleTranslation?: string
}
