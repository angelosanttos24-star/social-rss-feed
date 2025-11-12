import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash-exp';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Call Gemini API with retry logic
 */
export async function callGeminiAPI(prompt: string, maxRetries = 3): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const url = `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      }

      throw new Error('Invalid response format from Gemini API');
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        console.error('Gemini API failed after retries:', error);
        throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Gemini API call failed');
}

/**
 * Summarize a feed (multiple posts)
 */
export async function summarizeFeed(posts: Array<{ username: string; platform: string; description: string }>): Promise<string> {
  const postsText = posts
    .map((p) => `${p.username} (${p.platform}): ${p.description}`)
    .join('\n---\n');

  const prompt = `Analyze the following posts from a social media feed and provide a short summary (2-3 sentences) of the main topics and sentiments. Respond in Portuguese (Brazil):

${postsText}`;

  return callGeminiAPI(prompt);
}

/**
 * Summarize a single post
 */
export async function summarizePost(text: string): Promise<string> {
  const prompt = `Summarize the following post in a single short and concise sentence. Respond in Portuguese (Brazil):

${text}`;

  return callGeminiAPI(prompt);
}

/**
 * Suggest replies for a post
 */
export async function suggestReplies(text: string): Promise<string> {
  const prompt = `Suggest 3 short and casual replies (in Portuguese - Brazil) for the following post. Format as a bulleted list:

${text}`;

  return callGeminiAPI(prompt);
}
