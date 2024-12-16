// 确保 export 关键字在接口声明前
export interface CurrentLexicon {
  id: string
  name: string
}

export const LexiconStorage = {
  getCurrentLexicon(): CurrentLexicon | null {
    try {
      const lexicon = uni.getStorageSync('currentLexicon')
      // 添加调试日志

      return lexicon ? JSON.parse(lexicon) : null
    }
    catch (error) {
      console.error('获取词书信息失败:', error)
      return null
    }
  },

  setCurrentLexicon(lexicon: CurrentLexicon): void {
    try {
      // 存储前先打印

      uni.setStorageSync('currentLexicon', JSON.stringify(lexicon))
      // 存储后验证
      const stored = this.getCurrentLexicon()
      uni.showToast({
        title: stored ? '词书信息已存储' : '词书信息存储失败',
        icon: stored ? 'success' : 'none',
      })
    }
    catch (error) {
      console.error('存储词书信息失败:', error)
    }
  },

  clearCurrentLexicon(): void {
    uni.removeStorageSync('currentLexicon')
  },
}
