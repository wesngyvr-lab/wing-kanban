import { useState, useEffect } from 'react'

const COLUMNS = ['To Do', 'In Progress', 'Done']

const initialTasks = [
  { id: 1, title: 'Set up GitHub auth', column: 'Done', createdAt: Date.now() },
  { id: 2, title: 'Set up Gmail/Calendar (gog CLI)', column: 'To Do', createdAt: Date.now() },
  { id: 3, title: 'Port mahjong app to GitHub', column: 'To Do', createdAt: Date.now() },
  { id: 4, title: 'Build kanban board', column: 'In Progress', createdAt: Date.now() },
]

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('wing-kanban-tasks')
    return saved ? JSON.parse(saved) : initialTasks
  })
  const [newTask, setNewTask] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    localStorage.setItem('wing-kanban-tasks', JSON.stringify(tasks))
  }, [tasks])

  const addTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    
    setTasks([...tasks, {
      id: Date.now(),
      title: newTask.trim(),
      column: 'To Do',
      createdAt: Date.now()
    }])
    setNewTask('')
    setIsAdding(false)
  }

  const moveTask = (taskId, direction) => {
    setTasks(tasks.map(task => {
      if (task.id !== taskId) return task
      const currentIndex = COLUMNS.indexOf(task.column)
      const newIndex = direction === 'right' 
        ? Math.min(currentIndex + 1, COLUMNS.length - 1)
        : Math.max(currentIndex - 1, 0)
      return { ...task, column: COLUMNS[newIndex] }
    }))
  }

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const getTasksForColumn = (column) => 
    tasks.filter(t => t.column === column)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🪽 Wing Kanban</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
        >
          + Add Task
        </button>
      </div>

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
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Columns - Horizontal scroll on mobile */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {COLUMNS.map((column, colIndex) => (
          <div 
            key={column} 
            className="flex-shrink-0 w-80 snap-center"
          >
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">
                  {column === 'To Do' && '📋 '}
                  {column === 'In Progress' && '🔄 '}
                  {column === 'Done' && '✅ '}
                  {column}
                </h2>
                <span className="bg-gray-700 px-2 py-1 rounded-full text-sm">
                  {getTasksForColumn(column).length}
                </span>
              </div>
              
              <div className="space-y-3">
                {getTasksForColumn(column).map(task => (
                  <div 
                    key={task.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <p className="mb-3">{task.title}</p>
                    <div className="flex gap-2">
                      {colIndex > 0 && (
                        <button
                          onClick={() => moveTask(task.id, 'left')}
                          className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                        >
                          ← Back
                        </button>
                      )}
                      {colIndex < COLUMNS.length - 1 && (
                        <button
                          onClick={() => moveTask(task.id, 'right')}
                          className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                        >
                          Next →
                        </button>
                      )}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 px-2 py-1 rounded ml-auto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                
                {getTasksForColumn(column).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No tasks</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Wing's Task Tracker • Built for Wes 🪽</p>
      </div>
    </div>
  )
}

export default App
