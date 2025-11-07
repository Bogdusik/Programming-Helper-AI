'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import { trpc } from '@/lib/trpc-client'

export default function AdminPage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
  
  // Modal states
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'txt'>('json')
  
  // All hooks must be called before any conditional returns
  // Check admin role from database via tRPC
  const { data: userRole } = trpc.auth.getMyRole.useQuery(undefined, {
    enabled: isSignedIn && isLoaded,
    retry: false
  })
  
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = trpc.admin.getDashboardStats.useQuery(undefined, {
    enabled: isSignedIn && isLoaded,
    retry: false
  })
  
  // Get users list
  const { data: usersData, isLoading: usersLoading } = trpc.admin.getUsers.useQuery(
    { page: usersPage, limit: 20, search: usersSearch || undefined },
    { enabled: showUsersModal && isSignedIn && isLoaded }
  )
  
  const handleRefreshStats = () => {
    toast.promise(refetchStats(), {
      loading: 'Refreshing statistics...',
      success: 'Statistics refreshed successfully',
      error: 'Failed to refresh statistics',
    })
  }
  
  const handleClearCache = () => {
    toast((t) => (
      <div>
        <p className="mb-2">Are you sure you want to clear the cache?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.promise(refetchStats(), {
                loading: 'Clearing cache...',
                success: 'Cache cleared! Statistics refreshed.',
                error: 'Failed to clear cache',
              })
              toast.dismiss(t.id)
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Yes, clear cache
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
    })
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  // Calculate admin status after all hooks
  const isAdmin = user?.publicMetadata?.role === 'admin' || userRole?.role === 'admin'

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-white/80">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  if (!isAdmin && userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Access Denied</h1>
              <p className="mt-2 text-white/70">You don&apos;t have permission to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <Navbar />
      <div className="relative pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="mt-2 text-white/70">Manage the Programming Helper AI system</p>
          </div>

          {/* Admin Actions - moved to top */}
          <div className="mb-8">
            <div className="glass rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Admin Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowUsersModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  View All Users
                </button>
                <button 
                  onClick={() => setShowExportModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Export Data
                </button>
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  System Settings
                </button>
              </div>
            </div>
          </div>

          {statsError && (
            <div className="mb-6 glass border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">Error loading dashboard statistics. Please try again later.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Users */}
            <div className="glass overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-white">
                        {statsLoading ? (
                          <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                        ) : (
                          dashboardStats?.users.total ?? 0
                        )}
                      </dd>
                      {dashboardStats && (
                        <dd className="text-xs text-white/50 mt-1">
                          {dashboardStats.users.active24h} active (24h) • {dashboardStats.users.new24h} new (24h)
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Messages */}
            <div className="glass overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">Total Messages</dt>
                      <dd className="text-lg font-medium text-white">
                        {statsLoading ? (
                          <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                        ) : (
                          dashboardStats?.messages.total ?? 0
                        )}
                      </dd>
                      {dashboardStats && (
                        <dd className="text-xs text-white/50 mt-1">
                          {dashboardStats.messages.last24h} in last 24h • {dashboardStats.messages.userMessages} questions
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Sessions */}
            <div className="glass overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">Chat Sessions</dt>
                      <dd className="text-lg font-medium text-white">
                        {statsLoading ? (
                          <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                        ) : (
                          dashboardStats?.sessions.total ?? 0
                        )}
                      </dd>
                      {dashboardStats && (
                        <dd className="text-xs text-white/50 mt-1">
                          {dashboardStats.sessions.last24h} created (24h) • {dashboardStats.sessions.last7d} (7d)
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Average Response Time */}
            <div className="glass overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">Avg Response Time</dt>
                      <dd className="text-lg font-medium text-white">
                        {statsLoading ? (
                          <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                        ) : (
                          dashboardStats?.analytics.avgResponseTime ? `${dashboardStats.analytics.avgResponseTime}s` : '0s'
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Users (7 days) */}
            <div className="glass overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">Active Users (7d)</dt>
                      <dd className="text-lg font-medium text-white">
                        {statsLoading ? (
                          <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                        ) : (
                          dashboardStats?.users.active7d ?? 0
                        )}
                      </dd>
                      {dashboardStats && (
                        <dd className="text-xs text-white/50 mt-1">
                          {dashboardStats.users.new7d} new users (7d)
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="glass overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">System Health</dt>
                      <dd className="text-lg font-medium text-green-400">
                        {statsLoading ? (
                          <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                        ) : statsError ? (
                          <span className="text-red-400">Error</span>
                        ) : (
                          'Healthy'
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question Type Distribution */}
          {dashboardStats && Object.keys(dashboardStats.analytics.questionTypeDistribution).length > 0 && (
            <div className="mt-8">
              <div className="glass rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Question Type Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(dashboardStats.analytics.questionTypeDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="bg-white/10 rounded-lg p-4">
                        <div className="text-sm font-medium text-white/70">{type}</div>
                        <div className="text-2xl font-bold text-white mt-1">{count}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowUsersModal(false)}>
          <div className="glass rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">All Users</h2>
              <button 
                onClick={() => setShowUsersModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by user ID..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value)
                  setUsersPage(1)
                }}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="mt-4 text-white/70">Loading users...</p>
              </div>
            ) : usersData ? (
              <>
                <div className="space-y-2 mb-4">
                  {usersData.users.map((user) => (
                    <div key={user.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-medium">User ID: {user.id}</div>
                          <div className="text-white/60 text-sm mt-1">
                            Role: <span className={`font-semibold ${user.role === 'admin' ? 'text-green-400' : 'text-blue-400'}`}>{user.role}</span>
                          </div>
                          <div className="text-white/50 text-xs mt-2">
                            Messages: {user._count.messages} • Sessions: {user._count.chatSessions}
                          </div>
                          <div className="text-white/50 text-xs">
                            Created: {new Date(user.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {usersData.pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-white/70 text-sm">
                      Page {usersData.pagination.page} of {usersData.pagination.totalPages} ({usersData.pagination.total} total)
                    </span>
                    <button
                      onClick={() => setUsersPage(p => Math.min(usersData.pagination.totalPages, p + 1))}
                      disabled={usersPage === usersData.pagination.totalPages}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal 
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          format={exportFormat}
          onFormatChange={setExportFormat}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)}>
          <div className="glass rounded-2xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">System Settings</h2>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-2">Database Status</h3>
                <p className="text-white/70 text-sm">Connected to PostgreSQL</p>
                <p className="text-white/50 text-xs mt-1">Database: programming_helper_ai</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-2">System Information</h3>
                <div className="space-y-1 text-sm text-white/70">
                  <p>Next.js Version: 15.5.4</p>
                  <p>Prisma Version: 6.16.2</p>
                  <p>Database: PostgreSQL</p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-2">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleClearCache}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    Clear Cache
                  </button>
                  <button 
                    onClick={handleRefreshStats}
                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    Refresh Stats
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export Modal Component
function ExportModal({ isOpen, onClose, format, onFormatChange }: { 
  isOpen: boolean
  onClose: () => void
  format: 'json' | 'markdown' | 'txt'
  onFormatChange: (format: 'json' | 'markdown' | 'txt') => void
}) {
  const [isExporting, setIsExporting] = useState(false)
  const exportMutation = trpc.admin.exportData.useMutation()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportMutation.mutateAsync({ format })
      if (result) {
        // Create blob and download
        const blob = new Blob([result.data], { type: result.mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Data exported successfully!')
        onClose()
      }
    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to export data. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Export Data</h2>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Export Format</label>
            <select 
              value={format} 
              onChange={(e) => onFormatChange(e.target.value as 'json' | 'markdown' | 'txt')}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="json">JSON (.json)</option>
              <option value="markdown">Markdown (.md)</option>
              <option value="txt">Plain Text (.txt)</option>
            </select>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-white/70 text-sm">
              This will export all chat sessions and messages from the database.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}