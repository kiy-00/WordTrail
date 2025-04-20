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

    const data = await response.text()
    const [sentence, translation] = data.split('|')
    return {
      sentence: sentence?.trim() || '',
      translation: translation?.trim() || '',
    }
  }
  catch (error) {
    console.error('Error generating example sentence:', error)
    throw error
  }
}

/**
 * Generate a story and its translation based on given words.
 * @param language - The language of the story (e.g., "English", "Chinese").
 * @param words - An array of words to be included in the story.
 * @returns A promise that resolves to an object containing the story and its translation.
 */
export async function generateStory(language: string, words: string[]): Promise<{ story: string, translation: string }> {
  try {
    const token = uni.getStorageSync('token')
    const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-story`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        words,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch story: ${response.statusText}`)
    }

    const data = await response.text()
    const [story, translation] = data.split('|')
    return {
      story: story?.trim() || '',
      translation: translation?.trim() || '',
    }
  }
  catch (error) {
    console.error('Error generating story:', error)
    throw error
  }
}
