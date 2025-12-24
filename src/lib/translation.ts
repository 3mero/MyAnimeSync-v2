'use server';

// @ts-ignore
import translate from '@iamtraction/google-translate';


export async function translateTextServer(text: string, targetLang: 'ar' | 'en' = 'ar'): Promise<string | null> {
  if (!text) return null;

  try {
    const sourceLang = targetLang === 'ar' ? 'en' : 'ar';
    const translated = await translate(text, { from: sourceLang, to: targetLang });
    if (translated && translated.text) {
        console.log(`Translation successful for: "${text}" -> "${translated.text}"`);
        return translated.text;
    }
    return null;
  } catch (error: any) {
    console.error('Translation library error:', error);
    const errorMessage = error?.message || 'An internal server error occurred during translation.';
    console.error('Translation failed:', errorMessage);
    return null;
  }
}
