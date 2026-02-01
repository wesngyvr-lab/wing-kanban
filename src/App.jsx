import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const STATUSES = ['To Do', 'In Progress', 'Done']

// Default reminders (synced from Wing/Clawdbot)
const DEFAULT_REMINDERS = [
  {
    id: '1',
    title: '📅 Daily Briefing',
    description: 'Morning update at 8am Bangkok time',
    schedule: '0 1 * * * (8am BKK)',
    category: 'daily',
    enabled: true,
    nextRun: getNextRun8amBKK()
  }
]

function getNextRun8amBKK() {
  const now = new Date()
  const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const next = new Date(bkk)
  next.setHours(8, 0, 0, 0)
  if (next <= bkk) next.setDate(next.getDate() + 1)
  return next.toISOString()
}

function App() {
  const [activeTab, setActiveTab] = useState('kanban')
  const [tasks, setTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [newTask, setNewTask] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isAddingReminder, setIsAddingReminder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Load data
  useEffect(() => {
    loadTasks()
    loadReminders()
    
    const subscription = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error loading tasks:', error)
      const saved = localStorage.getItem('wing-kanban-tasks')
      if (saved) setTasks(JSON.parse(saved))
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  const loadReminders = () => {
    const saved = localStorage.getItem('wing-reminders')
    if (saved) {
      setReminders(JSON.parse(saved))
    } else {
      setReminders(DEFAULT_REMINDERS)
      localStorage.setItem('wing-reminders', JSON.stringify(DEFAULT_REMINDERS))
    }
  }

  const saveReminders = (newReminders) => {
    setReminders(newReminders)
    localStorage.setItem('wing-reminders', JSON.stringify(newReminders))
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    
    setSyncing(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: newTask.trim(), status: 'To Do' }])
      .select()
    
    if (error) {
      console.error('Error adding task:', error)
      alert('Failed to add task.')
    } else {
      setTasks([...tasks, data[0]])
    }
    
    setNewTask('')
    setIsAdding(false)
    setSyncing(false)
  }

  const moveTask = async (taskId, direction) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const currentIndex = STATUSES.indexOf(task.status)
    const newIndex = direction === 'right' 
      ? Math.min(currentIndex + 1, STATUSES.length - 1)
      : Math.max(currentIndex - 1, 0)
    const newStatus = STATUSES[newIndex]

    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
    
    if (error) loadTasks()
  }

  const deleteTask = async (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId))
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) loadTasks()
  }

  const toggleReminder = (id) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    )
    saveReminders(updated)
  }

  const deleteReminder = (id) => {
    if (confirm('Delete this reminder?')) {
      saveReminders(reminders.filter(r => r.id !== id))
    }
  }

  const addReminder = (e) => {
    e.preventDefault()
    const form = e.target
    const newReminder = {
      id: Date.now().toString(),
      title: form.title.value,
      description: form.description.value,
      schedule: form.schedule.value,
      category: form.category.value,
      enabled: true,
      nextRun: form.nextRun.value || null
    }
    saveReminders([...reminders, newReminder])
    setIsAddingReminder(false)
  }

  const getTasksForStatus = (status) => tasks.filter(t => t.status === status)

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">🪽 Wing</h1>
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'kanban' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              📋 Kanban
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'reminders' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              ⏰ Reminders
            </button>
          </div>
        </div>
        
        {activeTab === 'kanban' && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
          >
            + Add Task
          </button>
        )}
        {activeTab === 'reminders' && (
          <button
            onClick={() => setIsAddingReminder(true)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium"
          >
            + Add Reminder
          </button>
        )}
      </div>

      {syncing && (
        <div className="fixed top-4 right-4 bg-blue-600 px-3 py-1 rounded-full text-sm z-50">
          Syncing...
        </div>
      )}

      {/* Add Task Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={addTask} className="bg-gray-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Task</h2>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg">Cancel</button>
              <button type="submit" disabled={syncing} className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50">
                {syncing ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Reminder Modal */}
      {isAddingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={addReminder} className="bg-gray-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Reminder</h2>
            <input name="title" placeholder="Title (e.g., 🇹🇭 90-Day Report)" required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
            <input name="description" placeholder="Description" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input name="schedule" placeholder="Schedule (e.g., Day 45, 85, 90)" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
            <select name="category" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-3">
              <option value="general">📌 General</option>
              <option value="daily">📅 Daily</option>
              <option value="immigration">🇹🇭 Immigration</option>
              <option value="health">💊 Health</option>
              <option value="finance">💰 Finance</option>
            </select>
            <input name="nextRun" type="datetime-local" placeholder="Next Run" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsAddingReminder(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">Add</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban View */}
      {activeTab === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          {STATUSES.map((status, colIndex) => (
            <div key={status} className="flex-shrink-0 w-80 snap-center">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">
                    {status === 'To Do' && '📋 '}
                    {status === 'In Progress' && '🔄 '}
                    {status === 'Done' && '✅ '}
                    {status}
                  </h2>
                  <span className="bg-gray-700 px-2 py-1 rounded-full text-sm">
                    {getTasksForStatus(status).length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {getTasksForStatus(status).map(task => (
                    <div key={task.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <p className="mb-3">{task.title}</p>
                      <div className="flex gap-2">
                        {colIndex > 0 && (
                          <button onClick={() => moveTask(task.id, 'left')} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">← Back</button>
                        )}
                        {colIndex < STATUSES.length - 1 && (
                          <button onClick={() => moveTask(task.id, 'right')} className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">Next →</button>
                        )}
                        <button onClick={() => deleteTask(task.id)} className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 px-2 py-1 rounded ml-auto">🗑️</button>
                      </div>
                    </div>
                  ))}
                  {getTasksForStatus(status).length === 0 && (
                    <p className="text-gray-500 text-center py-8">No tasks</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reminders View */}
      {activeTab === 'reminders' && (
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            {reminders.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-500">No reminders yet</p>
                <p className="text-gray-600 text-sm mt-2">Add a reminder to get started</p>
              </div>
            ) : (
              reminders.map(reminder => (
                <div 
                  key={reminder.id} 
                  className={`bg-gray-800 rounded-xl p-4 border ${reminder.enabled ? 'border-gray-700' : 'border-gray-800 opacity-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                          {reminder.category === 'daily' && '📅'}
                          {reminder.category === 'immigration' && '🇹🇭'}
                          {reminder.category === 'health' && '💊'}
                          {reminder.category === 'finance' && '💰'}
                          {reminder.category === 'general' && '📌'}
                          {' '}{reminder.category}
                        </span>
                        {!reminder.enabled && <span className="text-xs text-gray-500">Disabled</span>}
                      </div>
                      <h3 className="font-bold text-lg">{reminder.title}</h3>
                      {reminder.description && <p className="text-gray-400 text-sm mt-1">{reminder.description}</p>}
                      <div className="mt-3 text-sm text-gray-500">
                        {reminder.schedule && <p>📆 {reminder.schedule}</p>}
                        {reminder.nextRun && <p>⏰ Next: {formatDate(reminder.nextRun)}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleReminder(reminder.id)}
                        className={`text-xs px-3 py-1 rounded ${reminder.enabled ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/40' : 'bg-green-600/20 text-green-400 hover:bg-green-600/40'}`}
                      >
                        {reminder.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 bg-gray-800/50 rounded-xl p-4 text-center text-sm text-gray-500">
            <p>💡 Reminders are managed by Wing via Telegram</p>
            <p className="mt-1">Message Wing to add/update reminders automatically</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Wing's Dashboard • Synced via Supabase 🪽</p>
      </div>
    </div>
  )
}

export default App
