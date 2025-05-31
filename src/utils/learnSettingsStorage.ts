export interface LearnSettings {
  wordsPerGroup: number
  dailyNewWordsGoal: number
  dailyReviewWordsGoal: number
}

const DEFAULT_SETTINGS: LearnSettings = {
  wordsPerGroup: 10,
  dailyNewWordsGoal: 20,
  dailyReviewWordsGoal: 30,
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
   * 更新学习设置中的每日新词目标
   */
  static updateDailyNewWordsGoal(count: number): void {
    const settings = this.getSettings()
    settings.dailyNewWordsGoal = count
    this.saveSettings(settings)
  }

  /**
   * 更新学习设置中的每日复习词目标
   */
  static updateDailyReviewWordsGoal(count: number): void {
    const settings = this.getSettings()
    settings.dailyReviewWordsGoal = count
    this.saveSettings(settings)
  }

  /**
   * 保存学习目标到后端
   */
  static async saveLearningGoalToServer(newWordsGoal: number, reviewWordsGoal: number): Promise<boolean> {
    try {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 2000,
        })
        return false
      }

      // 构建请求参数
      const url = `/api/v1/clock-in/goal`
      const response = await uni.request({
        url,
        method: 'POST',
        data: {
          dailyNewWordsGoal: newWordsGoal,
          dailyReviewWordsGoal: reviewWordsGoal,
        },
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      if (response.statusCode === 200) {
        return true
      }
      else {
        console.error('保存学习目标失败:', response)
        return false
      }
    }
    catch (error) {
      console.error('保存学习目标到后端失败:', error)
      return false
    }
  }
}
