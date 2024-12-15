export interface LanguageInfo {
  name: string
  displayName: string
  icon: string
  emoji: string
  successMessage: string
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    name: 'English',
    displayName: 'English',
    icon: 'i-circle-flags:us',
    emoji: '🇺🇸',
    successMessage: 'Now learning English',
  },
  {
    name: 'French',
    displayName: 'Français',
    icon: 'i-circle-flags:fr',
    emoji: '🇫🇷',
    successMessage: 'Maintenant en train d\'apprendre le français',
  },
  {
    name: 'German',
    displayName: 'Deutsch',
    icon: 'i-circle-flags:de',
    emoji: '🇩🇪',
    successMessage: 'Jetzt Deutsch lernen',
  },
]

export const LanguageStorage = {
  getCurrentLanguage(): LanguageInfo {
    const languageName = uni.getStorageSync('currentLanguage') || 'English'
    return SUPPORTED_LANGUAGES.find(lang => lang.name === languageName) || SUPPORTED_LANGUAGES[0]
  },

  setCurrentLanguage(languageName: string): void {
    uni.setStorageSync('currentLanguage', languageName)
  },
}
