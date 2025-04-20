import { API_BASE_URL } from '@/config/api'

/**
 * Generate an example sentence and its translation for a given word.
 * @param language - The language of the word (e.g., "English", "Chinese").
 * @param word - The word to generate an example sentence for.
 * @returns A promise that resolves to an object containing the example sentence and its translation.
 */

export async function generateExampleSentence(language: string, word: string): Promise<{ sentence: string, translation: string }> {
  try {
    const token = uni.getStorageSync('token')
    const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-sentence?language=${encodeURIComponent(language)}&word=${encodeURIComponent(word)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch example sentence: ${response.statusText}`)
    }

    const data = await response.text() // 接收返回的纯文本
    const [sentence, translation] = data.split('\n') // 按换行符分割，分别取例句和翻译
    return {
      sentence: sentence?.trim() || '', // 去除多余空格，确保返回字符串
      translation: translation?.trim() || '', // 去除多余空格，确保返回字符串
    }
  }
  catch (error) {
    console.error('Error generating example sentence:', error)
    throw error
  }
}
