import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { id: 'admin-user-id' },
    update: {},
    create: {
      id: 'admin-user-id',
      role: 'admin',
    },
  })

  const regularUser = await prisma.user.upsert({
    where: { id: 'user-id' },
    update: {},
    create: {
      id: 'user-id',
      role: 'user',
    },
  })

  await prisma.stats.upsert({
    where: { userId: regularUser.id },
    update: {},
    create: {
      userId: regularUser.id,
      questionsAsked: 5,
      avgResponseTime: 2.5,
      mostFrequentResponseType: 'code',
    },
  })

  // Seed assessment questions
  const assessmentQuestions = [
    // Beginner questions
    {
      question: 'What is a variable in programming?',
      type: 'multiple_choice',
      options: ['A container that stores data', 'A function that performs calculations', 'A loop that repeats code', 'A condition that checks values'],
      correctAnswer: 'A container that stores data',
      category: 'syntax',
      difficulty: 'beginner',
      language: null,
      explanation: 'A variable is a named container that stores data values that can be used and modified throughout a program.',
    },
    {
      question: 'What does the following code do?\n\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}',
      type: 'conceptual',
      correctAnswer: 'Prints numbers 0 through 4',
      category: 'logic',
      difficulty: 'beginner',
      language: 'javascript',
      explanation: 'This is a for loop that starts at 0, continues while i is less than 5, and increments i by 1 each iteration. It prints 0, 1, 2, 3, 4.',
    },
    {
      question: 'What is the purpose of a function?',
      type: 'multiple_choice',
      options: ['To store data', 'To organize and reuse code', 'To create variables', 'To print output'],
      correctAnswer: 'To organize and reuse code',
      category: 'syntax',
      difficulty: 'beginner',
      language: null,
      explanation: 'Functions allow you to organize code into reusable blocks that can be called multiple times.',
    },
    // Intermediate questions
    {
      question: 'What is the time complexity of binary search?',
      type: 'multiple_choice',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      correctAnswer: 'O(log n)',
      category: 'algorithms',
      difficulty: 'intermediate',
      language: null,
      explanation: 'Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.',
    },
    {
      question: 'What is the difference between == and === in JavaScript?',
      type: 'conceptual',
      correctAnswer: '== compares values with type coercion, === compares values and types strictly',
      category: 'syntax',
      difficulty: 'intermediate',
      language: 'javascript',
      explanation: '== performs type coercion before comparison, while === checks both value and type without coercion.',
    },
    {
      question: 'What is a closure in programming?',
      type: 'multiple_choice',
      options: ['A function that has access to variables in its outer scope', 'A way to close a program', 'A type of loop', 'A data structure'],
      correctAnswer: 'A function that has access to variables in its outer scope',
      category: 'syntax',
      difficulty: 'intermediate',
      language: null,
      explanation: 'A closure is a function that retains access to variables from its outer (enclosing) scope even after the outer function has finished executing.',
    },
    // Advanced questions
    {
      question: 'Explain the difference between stack and queue data structures.',
      type: 'conceptual',
      correctAnswer: 'Stack is LIFO (Last In First Out), Queue is FIFO (First In First Out)',
      category: 'data_structures',
      difficulty: 'advanced',
      language: null,
      explanation: 'Stack uses LIFO principle (like a stack of plates), while Queue uses FIFO principle (like a line of people).',
    },
    {
      question: 'What is memoization and when would you use it?',
      type: 'conceptual',
      correctAnswer: 'Memoization is caching function results to avoid redundant calculations, used for optimization',
      category: 'algorithms',
      difficulty: 'advanced',
      language: null,
      explanation: 'Memoization stores the results of expensive function calls and returns the cached result when the same inputs occur again, improving performance.',
    },
    // More beginner questions
    {
      question: 'What is an array?',
      type: 'multiple_choice',
      options: ['A collection of elements stored in contiguous memory', 'A single value', 'A function', 'A loop'],
      correctAnswer: 'A collection of elements stored in contiguous memory',
      category: 'data_structures',
      difficulty: 'beginner',
      language: null,
      explanation: 'An array is a data structure that stores a collection of elements, typically of the same type, in contiguous memory locations.',
    },
    {
      question: 'What does the if statement do?',
      type: 'multiple_choice',
      options: ['Repeats code', 'Executes code conditionally', 'Stores data', 'Defines a function'],
      correctAnswer: 'Executes code conditionally',
      category: 'logic',
      difficulty: 'beginner',
      language: null,
      explanation: 'An if statement allows you to execute code only when a certain condition is true.',
    },
    {
      question: 'What is a loop used for?',
      type: 'multiple_choice',
      options: ['Storing data', 'Repeating code multiple times', 'Defining variables', 'Printing output'],
      correctAnswer: 'Repeating code multiple times',
      category: 'logic',
      difficulty: 'beginner',
      language: null,
      explanation: 'Loops allow you to execute a block of code repeatedly until a certain condition is met.',
    },
    // More intermediate questions
    {
      question: 'What is recursion?',
      type: 'multiple_choice',
      options: ['A function that calls itself', 'A type of loop', 'A data structure', 'A variable'],
      correctAnswer: 'A function that calls itself',
      category: 'algorithms',
      difficulty: 'intermediate',
      language: null,
      explanation: 'Recursion is a programming technique where a function calls itself to solve a problem by breaking it down into smaller subproblems.',
    },
    {
      question: 'What is the difference between a list and a tuple in Python?',
      type: 'conceptual',
      correctAnswer: 'Lists are mutable, tuples are immutable',
      category: 'data_structures',
      difficulty: 'intermediate',
      language: 'python',
      explanation: 'Lists can be modified after creation (mutable), while tuples cannot be changed once created (immutable).',
    },
    {
      question: 'What is object-oriented programming (OOP)?',
      type: 'multiple_choice',
      options: ['A programming paradigm based on objects', 'A type of loop', 'A data structure', 'A function'],
      correctAnswer: 'A programming paradigm based on objects',
      category: 'syntax',
      difficulty: 'intermediate',
      language: null,
      explanation: 'OOP is a programming paradigm that organizes code into objects, which contain both data (attributes) and code (methods).',
    },
    // More advanced questions
    {
      question: 'What is the difference between pass-by-value and pass-by-reference?',
      type: 'conceptual',
      correctAnswer: 'Pass-by-value copies the value, pass-by-reference passes a reference to the original',
      category: 'syntax',
      difficulty: 'advanced',
      language: null,
      explanation: 'Pass-by-value creates a copy of the variable, while pass-by-reference passes a reference to the original variable, allowing modifications.',
    },
    {
      question: 'What is a hash table and what is its average time complexity for lookups?',
      type: 'conceptual',
      correctAnswer: 'A data structure that maps keys to values, O(1) average time complexity',
      category: 'data_structures',
      difficulty: 'advanced',
      language: null,
      explanation: 'A hash table uses a hash function to map keys to array indices, providing average O(1) time complexity for insertions, deletions, and lookups.',
    },
    // Python-specific questions
    {
      question: 'What is a list comprehension in Python?',
      type: 'conceptual',
      correctAnswer: 'A concise way to create lists based on existing lists',
      category: 'syntax',
      difficulty: 'intermediate',
      language: 'python',
      explanation: 'List comprehensions provide a concise way to create lists by applying an expression to each item in an iterable, optionally with filtering.',
    },
    // JavaScript-specific questions
    {
      question: 'What is the difference between let, const, and var in JavaScript?',
      type: 'conceptual',
      correctAnswer: 'let and const are block-scoped, var is function-scoped; const cannot be reassigned',
      category: 'syntax',
      difficulty: 'intermediate',
      language: 'javascript',
      explanation: 'let and const are block-scoped and cannot be hoisted, while var is function-scoped and can be hoisted. const also prevents reassignment.',
    },
    {
      question: 'What is the event loop in JavaScript?',
      type: 'conceptual',
      correctAnswer: 'A mechanism that handles asynchronous operations by continuously checking the call stack and callback queue',
      category: 'syntax',
      difficulty: 'advanced',
      language: 'javascript',
      explanation: 'The event loop is JavaScript\'s mechanism for handling asynchronous operations, managing the call stack, callback queue, and microtask queue.',
    },
  ]

  for (const question of assessmentQuestions) {
    const questionId = `q-${question.question.substring(0, 30).replace(/\s/g, '-').toLowerCase()}`
    await prisma.assessmentQuestion.upsert({
      where: { id: questionId },
      update: {},
      create: {
        id: questionId,
        question: question.question,
        type: question.type as any,
        options: question.options ? question.options as any : null,
        correctAnswer: question.correctAnswer,
        category: question.category,
        difficulty: question.difficulty,
        language: question.language,
        explanation: question.explanation || null,
      },
    })
  }

  // Seed programming tasks
  const programmingTasks = [
    {
      title: 'Reverse a String',
      description: 'Write a function that takes a string as input and returns the string reversed. For example, "hello" should become "olleh".',
      language: 'python',
      difficulty: 'beginner',
      category: 'algorithms',
      starterCode: 'def reverse_string(s):\n    # Your code here\n    pass',
      hints: [
        'Think about how to iterate through the string',
        'You can use slicing in Python',
        'Or build a new string character by character'
      ],
      solution: 'def reverse_string(s):\n    return s[::-1]',
    },
    {
      title: 'Find Maximum in Array',
      description: 'Write a function that finds and returns the maximum value in an array of numbers.',
      language: 'javascript',
      difficulty: 'beginner',
      category: 'algorithms',
      starterCode: 'function findMax(arr) {\n    // Your code here\n}',
      hints: [
        'Initialize a variable to track the maximum',
        'Loop through the array',
        'Compare each element with the current maximum'
      ],
      solution: 'function findMax(arr) {\n    let max = arr[0];\n    for (let i = 1; i < arr.length; i++) {\n        if (arr[i] > max) max = arr[i];\n    }\n    return max;\n}',
    },
    {
      title: 'Check Palindrome',
      description: 'Write a function that checks if a string is a palindrome (reads the same forwards and backwards).',
      language: 'python',
      difficulty: 'intermediate',
      category: 'algorithms',
      starterCode: 'def is_palindrome(s):\n    # Your code here\n    pass',
      hints: [
        'Remove spaces and convert to lowercase',
        'Compare the string with its reverse',
        'Or use two pointers approach'
      ],
      solution: 'def is_palindrome(s):\n    s = s.lower().replace(" ", "")\n    return s == s[::-1]',
    },
    {
      title: 'Binary Search',
      description: 'Implement binary search to find a target value in a sorted array. Return the index if found, -1 otherwise.',
      language: 'javascript',
      difficulty: 'intermediate',
      category: 'algorithms',
      starterCode: 'function binarySearch(arr, target) {\n    // Your code here\n}',
      hints: [
        'Use two pointers: left and right',
        'Calculate the middle index',
        'Compare target with middle element and adjust pointers'
      ],
      solution: 'function binarySearch(arr, target) {\n    let left = 0, right = arr.length - 1;\n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (arr[mid] === target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}',
    },
  ]

  for (const task of programmingTasks) {
    const taskId = `task-${task.title.toLowerCase().replace(/\s/g, '-')}`
    await prisma.programmingTask.upsert({
      where: { id: taskId },
      update: {},
      create: {
        id: taskId,
        title: task.title,
        description: task.description,
        language: task.language,
        difficulty: task.difficulty,
        category: task.category,
        starterCode: task.starterCode,
        hints: task.hints,
        solution: task.solution,
      },
    })
  }

  console.log('Seed data created successfully!')
  console.log(`Created ${assessmentQuestions.length} assessment questions`)
  console.log(`Created ${programmingTasks.length} programming tasks`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
