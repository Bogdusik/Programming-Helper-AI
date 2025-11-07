import OpenAI from 'openai'
import { getSystemPrompt } from './prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateResponse(
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
  try {
    // Get specialized system prompt based on the message and conversation history
    const systemPrompt = getSystemPrompt(message, conversationHistory)
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ]
    
    // Add conversation history (limit to last 20 messages to avoid token limits)
    if (conversationHistory && conversationHistory.length > 0) {
      // Take last 20 messages to stay within token limits
      const recentHistory = conversationHistory.slice(-20)
      
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      })
    }
    
    // Add current message
    messages.push({
      role: "user",
      content: message
    })
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response."
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate response')
  }
}

export async function analyzeQuestionType(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that categorizes programming questions. Based on the user's question, determine the most appropriate category from these options: 'Code Debugging', 'Algorithm Help', 'Syntax Questions', 'Framework Help', 'Database Queries', 'API Integration', 'General Programming', 'Code Review'. Return only the category name, nothing else."
        },
        {
          role: "user",
          content: `Categorize this programming question: "${message}"`
        }
      ],
      max_tokens: 20,
      temperature: 0.3,
    })

    const category = completion.choices[0]?.message?.content?.trim() || 'General Programming'
    return category
  } catch (error) {
    console.error('Error analyzing question type:', error)
    return 'General Programming'
  }
}

export async function generateChatTitle(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, descriptive titles for programming chat conversations. Based on the user's question, generate a short, clear title (max 6 words) that captures the main topic or programming concept being discussed. Examples: 'React Hooks Help', 'Python Debugging', 'Database Design', 'API Integration', 'CSS Styling Issues'. Return only the title, nothing else."
        },
        {
          role: "user",
          content: `Create a title for this programming question: "${message}"`
        }
      ],
      max_tokens: 20,
      temperature: 0.3,
    })

    const title = completion.choices[0]?.message?.content?.trim() || 'Programming Question'
    
    // Clean up the title and ensure it's not too long
    const cleanTitle = title.replace(/['"]/g, '').trim()
    
    if (cleanTitle.length > 50 || cleanTitle.length < 3) {
      return message.length > 50 ? message.substring(0, 50) + "..." : message
    }
    
    return cleanTitle
  } catch (error) {
    console.error('Error generating title:', error)
    // Fallback to original logic
    return message.length > 50 ? message.substring(0, 50) + "..." : message
  }
}
