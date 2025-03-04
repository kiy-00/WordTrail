export interface LearnSettings {
  wordsPerGroup: number
  enableSpelling: boolean
}

const DEFAULT_SETTINGS: LearnSettings = {
  wordsPerGroup: 10,
  enableSpelling: true,
}

export class LearnSettingsStorage {
  private static readonly STORAGE_KEY = 'learnSettings'

  /**
   * 获取学习设置
   */
  static getSettings(): LearnSettings {
    try {
      const settings = uni.getStorageSync(this.STORAGE_KEY)
      return settings ? (settings as LearnSettings) : DEFAULT_SETTINGS
    }
    catch (error) {
      console.error('获取学习设置失败:', error)
      return DEFAULT_SETTINGS
    }
  }

  /**
   * 保存学习设置
   */
  static saveSettings(settings: LearnSettings): void {
    try {
      uni.setStorageSync(this.STORAGE_KEY, settings)
    }
    catch (error) {
      console.error('保存学习设置失败:', error)
    }
  }

  /**
   * 更新学习设置中的单词数量
   */
  static updateWordsPerGroup(count: number): void {
    const settings = this.getSettings()
    settings.wordsPerGroup = count
    this.saveSettings(settings)
  }

  /**
   * 更新学习设置中的拼写增强选项
   */
  static updateEnableSpelling(enable: boolean): void {
    const settings = this.getSettings()
    settings.enableSpelling = enable
    this.saveSettings(settings)
  }
}
