/**
 * Validates if a message is related to programming
 * Used to restrict AI responses to programming topics only
 */

const PROGRAMMING_KEYWORDS = [
  // General programming
  'code', 'programming', 'program', 'coding', 'developer', 'development',
  'function', 'variable', 'constant', 'array', 'list', 'dictionary', 'object',
  'class', 'method', 'property', 'attribute', 'parameter', 'argument',
  'loop', 'for', 'while', 'if', 'else', 'switch', 'case', 'break', 'continue',
  'return', 'void', 'null', 'undefined', 'true', 'false', 'boolean',
  'string', 'number', 'integer', 'float', 'double', 'char', 'byte',
  
  // Programming concepts
  'algorithm', 'data structure', 'data structure', 'stack', 'queue', 'tree',
  'graph', 'hash', 'map', 'set', 'linked list', 'binary search', 'sort',
  'recursion', 'iteration', 'optimization', 'complexity', 'big o',
  
  // Code operations
  'syntax', 'error', 'bug', 'debug', 'debugging', 'exception', 'try', 'catch',
  'throw', 'compile', 'compilation', 'runtime', 'compile time', 'execute',
  'run', 'test', 'testing', 'unit test', 'integration test', 'test case',
  'refactor', 'refactoring', 'optimize', 'performance', 'memory', 'cpu',
  
  // Languages and frameworks
  'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 'cpp', 'c++',
  'c#', 'csharp', 'rust', 'go', 'golang', 'php', 'ruby', 'swift', 'kotlin',
  'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring',
  'next.js', 'nextjs', 'nestjs', 'laravel', 'rails',
  
  // Web development
  'html', 'css', 'dom', 'api', 'rest', 'graphql', 'http', 'https', 'endpoint',
  'request', 'response', 'json', 'xml', 'fetch', 'axios', 'async', 'await',
  'promise', 'callback', 'event', 'listener', 'handler',
  
  // Databases
  'database', 'db', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
  'query', 'table', 'row', 'column', 'index', 'foreign key', 'primary key',
  'join', 'select', 'insert', 'update', 'delete', 'transaction',
  
  // Version control
  'git', 'github', 'gitlab', 'commit', 'branch', 'merge', 'pull request',
  'repository', 'repo', 'clone', 'push', 'pull',
  
  // Development tools
  'npm', 'yarn', 'package', 'module', 'import', 'export', 'require',
  'dependency', 'library', 'framework', 'sdk', 'ide', 'editor',
  
  // Code patterns
  'pattern', 'design pattern', 'singleton', 'factory', 'observer', 'mvc',
  'mvp', 'mvvm', 'oop', 'object oriented', 'functional', 'procedural',
  'imperative', 'declarative',
  
  // Specific operations
  'parse', 'stringify', 'encode', 'decode', 'serialize', 'deserialize',
  'iterate', 'filter', 'map', 'reduce', 'find', 'search', 'sort',
  'reverse', 'split', 'join', 'concat', 'substring', 'slice', 'splice',
  
  // Common issues
  'fix', 'issue', 'problem', 'solution', 'workaround', 'patch', 'hotfix',
  'crash', 'freeze', 'hang', 'timeout', 'deadlock', 'race condition',
  'memory leak', 'stack overflow', 'null pointer', 'undefined reference',
  
  // Learning
  'learn', 'tutorial', 'example', 'sample', 'documentation', 'docs',
  'guide', 'how to', 'explain', 'understand', 'concept', 'principle',
  'best practice', 'convention', 'standard', 'style guide',
  
  // Russian keywords for programming-related questions
  'совет', 'советы', 'рекомендация', 'рекомендации', 'рекомендовать', 'рекомендуй',
  'улучшить', 'улучшение', 'навыки', 'навык', 'скилл', 'скиллы',
  'coding challenge', 'coding challenges', 'challenge', 'challenges',
  'помощь', 'помоги', 'помочь', 'подскажи', 'подсказка', 'подсказки',
  'вопрос', 'вопросы', 'задача', 'задачи', 'решение', 'решения',
  'что еще', 'какие еще', 'еще', 'дополнительно', 'дополнительные',
]

const NON_PROGRAMMING_KEYWORDS = [
  // Academic subjects
  'essay', 'thesis', 'dissertation', 'paper', 'research paper',
  'history', 'philosophy', 'literature', 'poetry', 'novel', 'story',
  'mathematics', 'physics', 'chemistry', 'biology', 'geography',
  
  // General conversation
  'weather', 'recipe', 'cooking', 'travel', 'vacation', 'holiday',
  'movie', 'film', 'music', 'song', 'book', 'game', 'sport',
  'relationship', 'dating', 'marriage', 'family', 'friend',
  
  // Personal advice
  'advice', 'help me with', 'what should i do', 'personal problem',
  'emotional', 'feeling', 'depressed', 'anxious', 'stress',
  
  // Other topics
  'translate', 'translation', 'language learning', 'grammar',
  'writing', 'creative writing', 'fiction', 'non-fiction',
]

/**
 * Checks if a message is related to programming
 * @param message - The message to check
 * @param conversationHistory - Optional conversation history to check context
 * @returns true if the message is programming-related
 */
export function isProgrammingRelated(
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
): boolean {
  const lowerMessage = message.toLowerCase().trim()
  
  // Empty or very short messages are not programming related
  if (lowerMessage.length < 3) {
    return false
  }
  
  // Check for explicit non-programming keywords first
  const hasNonProgrammingKeyword = NON_PROGRAMMING_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  )
  
  if (hasNonProgrammingKeyword) {
    // But allow if it's in a programming context
    // e.g., "how to parse json in python" should be allowed
    const hasProgrammingContext = PROGRAMMING_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword)
    )
    if (!hasProgrammingContext) {
      // If no programming context in current message, check conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        const historyText = conversationHistory
          .map(msg => msg.content)
          .join(' ')
          .toLowerCase()
        const hasHistoryProgrammingContext = PROGRAMMING_KEYWORDS.some(keyword =>
          historyText.includes(keyword)
        )
        if (hasHistoryProgrammingContext) {
          // If conversation history has programming context, allow continuation questions
          return true
        }
      }
      return false
    }
  }
  
  // Check for programming keywords in current message
  const hasProgrammingKeyword = PROGRAMMING_KEYWORDS.some(keyword =>
    lowerMessage.includes(keyword)
  )
  
  if (hasProgrammingKeyword) {
    return true
  }
  
  // Check for code-like patterns
  const codePatterns = [
    /[a-zA-Z_][a-zA-Z0-9_]*\s*\(/,  // function calls
    /[a-zA-Z_][a-zA-Z0-9_]*\s*=/,   // variable assignments
    /[{}[\]]/,                       // brackets
    /[<>]/,                          // angle brackets
    /\/\/|\/\*|\*\/|#/,              // comments
    /\.(js|ts|py|java|cpp|cs|rs|go|php|rb|swift|kt)$/i, // file extensions
  ]
  
  const hasCodePattern = codePatterns.some(pattern => pattern.test(lowerMessage))
  
  if (hasCodePattern) {
    return true
  }
  
  // If current message doesn't have explicit programming keywords but we have conversation history,
  // check if the conversation is about programming (continuation questions like "what else?", "more tips?", etc.)
  if (conversationHistory && conversationHistory.length > 0) {
    const historyText = conversationHistory
      .map(msg => msg.content.toLowerCase())
      .join(' ')
    
    // Check if any message in history contains programming keywords
    const hasHistoryProgrammingKeyword = PROGRAMMING_KEYWORDS.some(keyword =>
      historyText.includes(keyword)
    )
    
    if (hasHistoryProgrammingKeyword) {
      // Check if current message is a continuation question (asking for more, additional tips, etc.)
      const continuationKeywords = [
        'what else', 'what more', 'more', 'another', 'other', 'additional',
        'еще', 'какие еще', 'что еще', 'дополнительно', 'другие', 'еще один',
        'совет', 'советы', 'рекомендация', 'рекомендации', 'рекомендовать', 'рекомендуй',
        'tips', 'tip', 'advice', 'suggest', 'suggestion', 'recommend', 'recommendation',
        'помоги', 'помощь', 'подскажи', 'подсказка', 'подсказки',
      ]
      
      const isContinuationQuestion = continuationKeywords.some(keyword =>
        lowerMessage.includes(keyword)
      )
      
      if (isContinuationQuestion) {
        // This is a continuation of a programming conversation
        return true
      }
    }
  }
  
  return false
}

/**
 * Gets a polite rejection message for non-programming queries
 */
export function getRejectionMessage(): string {
  const messages = [
    "I'm designed to help with programming questions only. Please ask me about code, algorithms, debugging, or programming concepts. How can I assist you with your programming task?",
    "I specialize in programming assistance. Could you rephrase your question to focus on coding, software development, or programming concepts?",
    "I can only help with programming-related questions. Feel free to ask about code, debugging, algorithms, data structures, or any programming language!",
  ]
  
  return messages[Math.floor(Math.random() * messages.length)]
}

