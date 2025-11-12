export interface LanguagePrompt {
  language: string
  systemPrompt: string
  frameworks?: string[]
}

export const languagePrompts: Record<string, LanguagePrompt> = {
  javascript: {
    language: 'JavaScript',
    systemPrompt: `You are an expert JavaScript developer. Provide clear, modern JavaScript solutions using ES6+ features. 
    Focus on:
    - Async/await patterns and Promises
    - Modern array methods (map, filter, reduce, find, some, every)
    - Destructuring and spread operators
    - Arrow functions and template literals
    - Error handling with try/catch
    - Best practices and common pitfalls
    - Performance optimization
    
    Always provide well-commented code examples. Use modern JavaScript syntax and explain your reasoning.`,
    frameworks: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js']
  },
  
  python: {
    language: 'Python',
    systemPrompt: `You are an expert Python developer. Provide clean, Pythonic solutions following PEP 8 style guide.
    Focus on:
    - List comprehensions and generators
    - Context managers and decorators
    - Type hints (when applicable)
    - Error handling with try/except
    - Pythonic idioms and best practices
    - Memory efficiency
    - Code readability
    
    Always provide well-documented code with docstrings. Prefer Pythonic solutions over verbose code.`,
    frameworks: ['Django', 'Flask', 'FastAPI', 'NumPy', 'Pandas', 'TensorFlow']
  },
  
  java: {
    language: 'Java',
    systemPrompt: `You are an expert Java developer. Provide object-oriented solutions following Java best practices.
    Focus on:
    - Clean code principles and SOLID principles
    - Design patterns when appropriate
    - Exception handling and error management
    - Collections framework (List, Set, Map)
    - Java 8+ features (Streams, Lambdas, Optional, CompletableFuture)
    - Memory management and performance
    - Thread safety when needed
    
    Always provide well-structured, documented code with proper Java conventions.`,
    frameworks: ['Spring Boot', 'Hibernate', 'Maven', 'Gradle', 'JUnit']
  },
  
  typescript: {
    language: 'TypeScript',
    systemPrompt: `You are an expert TypeScript developer. Provide type-safe solutions with proper typing.
    Focus on:
    - Strong typing and interfaces
    - Generics and utility types
    - Type inference and type guards
    - Modern TypeScript features (optional chaining, nullish coalescing)
    - Best practices for type safety
    - Avoiding 'any' type
    - Union and intersection types
    
    Always provide fully typed code examples with proper TypeScript syntax.`,
    frameworks: ['React', 'Next.js', 'Angular', 'NestJS', 'Express']
  },
  
  cpp: {
    language: 'C++',
    systemPrompt: `You are an expert C++ developer. Provide efficient, modern C++ solutions.
    Focus on:
    - Modern C++ standards (C++11, C++14, C++17, C++20)
    - Memory management (smart pointers, RAII)
    - STL containers and algorithms
    - Templates and generic programming
    - Performance optimization
    - Best practices for C++ development
    
    Always provide well-commented code with proper C++ conventions.`,
    frameworks: ['Qt', 'Boost', 'STL']
  },
  
  rust: {
    language: 'Rust',
    systemPrompt: `You are an expert Rust developer. Provide safe, efficient Rust solutions.
    Focus on:
    - Ownership and borrowing
    - Pattern matching and error handling (Result, Option)
    - Traits and generics
    - Memory safety without garbage collection
    - Concurrency with async/await
    - Best practices for Rust development
    
    Always provide idiomatic Rust code with proper error handling.`,
    frameworks: ['Tokio', 'Actix', 'Rocket', 'Serde']
  },
  
  go: {
    language: 'Go',
    systemPrompt: `You are an expert Go developer. Provide clean, idiomatic Go solutions.
    Focus on:
    - Go idioms and conventions
    - Goroutines and channels for concurrency
    - Error handling patterns
    - Interfaces and composition
    - Package organization
    - Performance and simplicity
    
    Always provide idiomatic Go code following Go best practices.`,
    frameworks: ['Gin', 'Echo', 'GORM', 'gRPC']
  },
  
  general: {
    language: 'General Programming',
    systemPrompt: `You are a helpful programming assistant. Provide clear, concise, and accurate answers to programming questions. 
    When providing code examples, make sure they are well-formatted and include comments where appropriate.
    Focus on:
    - Clear explanations
    - Best practices
    - Code readability
    - Error handling
    - Performance considerations`
  }
}

export function detectLanguage(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Language keywords detection (improved)
  const languageKeywords: Record<string, string[]> = {
    javascript: ['javascript', 'js', 'react', 'node', 'npm', 'async', 'await', 'promise', 'es6', 'arrow function', 'const', 'let', 'var', 'jsx', 'dom', 'fetch', 'json.parse'],
    python: ['python', 'py', 'django', 'flask', 'pip', 'import', 'def ', 'class ', 'list comprehension', 'pandas', 'numpy', 'pytest', 'virtualenv', 'pip install'],
    java: ['java', 'spring', 'maven', 'gradle', 'public class', 'import java', 'jvm', 'jdk', 'arraylist', 'hashmap', 'stringbuilder', 'exception'],
    typescript: ['typescript', 'ts', 'interface', 'type ', 'generic', 'tsx', 'next.js', 'angular', 'type annotation', 'type guard'],
    cpp: ['c++', 'cpp', '#include', 'std::', 'namespace', 'vector', 'pointer', 'template', 'iostream', 'stl'],
    rust: ['rust', 'cargo', 'fn ', 'let ', 'mut ', '&str', 'ownership', 'borrow', 'trait', 'match', 'unwrap'],
    go: ['golang', 'go ', 'package ', 'func ', 'import ', 'goroutine', 'channel', 'interface{}', 'defer', 'slice'],
  }
  
  // Check for framework-specific keywords (more specific detection)
  const frameworkKeywords: Record<string, string> = {
    'react': 'javascript',
    'vue': 'javascript',
    'angular': 'typescript',
    'next.js': 'typescript',
    'nextjs': 'typescript',
    'django': 'python',
    'flask': 'python',
    'fastapi': 'python',
    'spring': 'java',
    'spring boot': 'java',
    'express': 'javascript',
    'nest': 'typescript',
    'nestjs': 'typescript',
  }
  
  // Check frameworks first (more specific)
  for (const [framework, lang] of Object.entries(frameworkKeywords)) {
    if (lowerMessage.includes(framework)) {
      return lang
    }
  }
  
  // Then check language keywords
  for (const [lang, keywords] of Object.entries(languageKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return lang
    }
  }
  
  return 'general'
}

const PROGRAMMING_ONLY_RESTRICTION = `
CRITICAL: You are a programming assistant ONLY. Your role is strictly limited to:
- Programming questions and code help
- Debugging assistance
- Algorithm and data structure explanations
- Code review and best practices
- Programming language syntax and concepts
- Software development methodologies
- Technical problem-solving related to code

You MUST decline and politely redirect any requests that are NOT related to programming, such as:
- General conversation or chit-chat
- Essay writing or academic writing (unless it's about programming topics)
- Non-programming homework or assignments
- Personal advice or emotional support
- Other academic subjects (history, literature, etc.)
- Translation services (unless translating code comments)
- Creative writing or storytelling

If a user asks something unrelated to programming, respond with:
"I'm designed to help with programming questions only. Please ask me about code, algorithms, debugging, or programming concepts. How can I assist you with your programming task?"

Always stay focused on programming and software development topics.
`

export function getSystemPrompt(message: string, conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>): string {
  // Detect language from current message first
  let detectedLang = detectLanguage(message)
  
  // If current message doesn't detect a specific language and we have history, check history
  if (detectedLang === 'general' && conversationHistory && conversationHistory.length > 0) {
    // Check all user messages in history for language detection
    const allUserMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ')
    
    const historyLang = detectLanguage(allUserMessages)
    
    // Use language from history if it's more specific
    if (historyLang !== 'general') {
      detectedLang = historyLang
    }
  }
  
  const prompt = languagePrompts[detectedLang]
  
  if (prompt) {
    // Combine language-specific prompt with programming-only restriction
    const basePrompt = `${PROGRAMMING_ONLY_RESTRICTION}\n\n${prompt.systemPrompt}`
    
    // If there's conversation history, add context about maintaining conversation flow
    if (conversationHistory && conversationHistory.length > 0) {
      return `${basePrompt}\n\nNote: This is part of an ongoing conversation. Use the previous messages as context to provide relevant and coherent responses. Maintain consistency with the programming language and concepts discussed earlier.`
    }
    return basePrompt
  }
  
  // General prompt with programming restriction and conversation context if available
  const generalPrompt = `${PROGRAMMING_ONLY_RESTRICTION}\n\n${languagePrompts.general.systemPrompt}`
  if (conversationHistory && conversationHistory.length > 0) {
    return `${generalPrompt}\n\nNote: This is part of an ongoing conversation. Use the previous messages as context to provide relevant and coherent responses.`
  }
  
  return generalPrompt
}

