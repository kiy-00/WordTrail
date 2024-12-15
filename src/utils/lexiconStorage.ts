// 确保 export 关键字在接口声明前
export interface CurrentLexicon {
  id: string
  name: string
}

export const LexiconStorage = {
  getCurrentLexicon(): CurrentLexicon | null {
    const lexiconData = uni.getStorageSync('currentLexicon')
    return lexiconData ? JSON.parse(lexiconData) : null
  },

  setCurrentLexicon(lexicon: CurrentLexicon): void {
    uni.setStorageSync('currentLexicon', JSON.stringify(lexicon))
  },

  clearCurrentLexicon(): void {
    uni.removeStorageSync('currentLexicon')
  },
}
