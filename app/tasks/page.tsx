'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import MinimalBackground from '../../components/MinimalBackground'
import { trpc } from '../../lib/trpc-client'

export default function TasksPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>()
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>()
  
  const { data: tasks, isLoading } = trpc.task.getTasks.useQuery({
    language: selectedLanguage,
    difficulty: selectedDifficulty,
    includeProgress: true,
  })
  
  const completeTaskMutation = trpc.task.completeTask.useMutation()
  const updateProgressMutation = trpc.task.updateTaskProgress.useMutation()
  
  const { data: userProfile } = trpc.profile.getProfile.useQuery(undefined, {
    enabled: isSignedIn,
  })

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  const handleStartTask = async (taskId: string) => {
    try {
      await updateProgressMutation.mutateAsync({
        taskId,
        status: 'in_progress',
      })
      // Refresh tasks
      window.location.reload()
    } catch (error) {
      console.error('Error starting task:', error)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTaskMutation.mutateAsync({ taskId })
      // Refresh tasks and stats
      window.location.reload()
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Error completing task. Please try again.')
    }
  }

  const getTaskStatus = (task: any) => {
    const progress = task.userProgress?.[0]
    return progress?.status || 'not_started'
  }

  const isTaskCompleted = (task: any) => {
    return getTaskStatus(task) === 'completed'
  }

  const isTaskInProgress = (task: any) => {
    return getTaskStatus(task) === 'in_progress'
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <Navbar />
      <MinimalBackground />

      <div className="relative pt-20 pb-8 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Programming Tasks</h1>
            <p className="text-white/70 text-lg">Complete tasks to improve your skills and unlock post-assessment</p>
          </div>

          {/* Filters */}
          <div className="glass rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center justify-center">
            <div>
              <label className="text-sm text-white/70 mr-2">Language:</label>
              <select
                value={selectedLanguage || ''}
                onChange={(e) => setSelectedLanguage(e.target.value || undefined)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">All Languages</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white/70 mr-2">Difficulty:</label>
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value || undefined)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Tasks Grid */}
          {tasks && tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => {
                const status = getTaskStatus(task)
                const isCompleted = isTaskCompleted(task)
                const inProgress = isTaskInProgress(task)

                return (
                  <div
                    key={task.id}
                    className={`glass rounded-lg p-6 ${
                      isCompleted
                        ? 'border-2 border-green-500/50 bg-gradient-to-br from-green-900/20 to-blue-900/20'
                        : inProgress
                        ? 'border-2 border-blue-500/50'
                        : 'border border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">{task.title}</h3>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded capitalize">
                            {task.language}
                          </span>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded capitalize">
                            {task.difficulty}
                          </span>
                          {isCompleted && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                              ✓ Completed
                            </span>
                          )}
                          {inProgress && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-white/70 text-sm mb-4 line-clamp-3">{task.description}</p>

                    <div className="flex gap-2">
                      {status === 'not_started' && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Start Task
                        </button>
                      )}
                      {inProgress && (
                        <>
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Mark Complete
                          </button>
                        </>
                      )}
                      {isCompleted && (
                        <div className="flex-1 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-center">
                          Completed ✓
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">No tasks available. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

