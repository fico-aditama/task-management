'use client';

import { useState, useEffect } from 'react';
import { Task, Status, Priority } from '@prisma/client';
import { format } from 'date-fns';
import {
  PlusCircle, ListTodo, Clock, Trash2, AlertCircle, 
  Search, Moon, Sun
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// API functions
const api = {
  getTasks: async () => {
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },
  createTask: async (formData: FormData) => {
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority') || 'MEDIUM',
      dueDate: formData.get('dueDate'),
      status: 'PENDING'
    };
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },
  updateTaskStatus: async (id: string, status: Status) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update task');
    }
    return res.json();
  },
  deleteTask: async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete task');
    }
    return res.json();
  },
};

// Task Card Component
function TaskCard({ task, onStatusChange, onDelete, darkMode, onClick }: {
  task: Task;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  darkMode: boolean;
  onClick: () => void;
}) {
  const statusColors = {
    PENDING: darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200',
    IN_PROGRESS: darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200',
    COMPLETED: darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200',
  };

  const priorityConfig = {
    LOW: { 
      color: darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600', 
      icon: null 
    },
    MEDIUM: { 
      color: darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600', 
      icon: null 
    },
    HIGH: { 
      color: darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-600', 
      icon: <AlertCircle className="h-4 w-4" /> 
    },
  };

  return (
    <div onClick={onClick} className={`rounded-lg border p-4 ${statusColors[task.status]} transition-all hover:shadow-lg cursor-pointer`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${priorityConfig[task.priority].color}`}>
            {priorityConfig[task.priority].icon}
            <span>{task.priority}</span>
          </div>
        </div>
        {task.description && (
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {task.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-2">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
            className={`text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          >
            {Object.values(Status).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');

  useEffect(() => {
    loadTasks();
  }, []);
  
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading tasks:', err);  
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks
    .filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(task => statusFilter === 'ALL' || task.status === statusFilter)
    .filter(task => priorityFilter === 'ALL' || task.priority === priorityFilter);

  const pendingTasks = filteredTasks.filter(task => task.status === 'PENDING');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter(task => task.status === 'COMPLETED');
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.deleteTask(id);
      toast.success('Task deleted successfully!');
      await loadTasks();
    } catch (err) {
      toast.error('Failed to delete task');
      console.error(err);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Status;

    try {
      await api.updateTaskStatus(draggableId, newStatus);
      toast.success('Task status updated!');
      await loadTasks();
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      await api.createTask(formData);
      toast.success('Task created successfully!');
      await loadTasks();
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error('Failed to create task');
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, status: Status) => {
    try {
      await api.updateTaskStatus(id, status);
      toast.success('Task status updated successfully!');
      await loadTasks();
    } catch (err) {
      toast.error('Failed to update task');
      console.error(err);
    }
  };

  function Column({ title, tasks, status, darkMode, onDelete }: {
    title: string;
    tasks: Task[];
    status: Status;
    darkMode: boolean;
    onDelete: (id: string) => void;
  }) {
    return (
      <div className="flex flex-col">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          {title}
        </h3>
        <Droppable droppableId={status}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`bg-gray-100 rounded-lg p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={onDelete}
                        darkMode={darkMode}
                        onClick={() => console.log(`Task clicked: ${task.title}`)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      <ToastContainer />
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ListTodo className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Task Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {tasks.length} total tasks
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4 mb-8`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status | 'ALL')}
                className={`p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                }`}
              >
                <option value="ALL">All Status</option>
                {Object.values(Status).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
                className={`p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                }`}
              >
                <option value="ALL">All Priorities</option>
                {Object.values(Priority).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'status')}
                className={`p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                }`}
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1`}>
              Pending
            </div>
            <div className="text-2xl font-bold text-yellow-500">{pendingTasks.length}</div>
          </div>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1`}>
              In Progress
            </div>
            <div className="text-2xl font-bold text-blue-500">{inProgressTasks.length}</div>
          </div>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1`}>
              Completed
            </div>
            <div className="text-2xl font-bold text-green-500">{completedTasks.length}</div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden mb-8`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center space-x-3">
              <PlusCircle className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Add New Task
              </h2>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Task Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 placeholder-gray-400'
                  }`}
                  placeholder="What needs to be done?"
                />
              </div>
              
              <div>
                <label htmlFor="description" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 placeholder-gray-400'
                  }`}
                  placeholder="Add more details about this task..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Priority Level
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dueDate" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Due Date
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    name="dueDate"
                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue- 500 transition-all ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 transition-all flex items-center space-x-2"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Create Task</span>
              </button>
            </div>
          </form>
        </div>

        {/* <div className="space-y-8">
          {filteredTasks.length > 0 ? (
            <>
              {pendingTasks.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Pending Tasks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        darkMode={darkMode}
                        onClick={() => console.log(`Task clicked: ${task.title}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {inProgressTasks.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    In Progress
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inProgressTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        darkMode={darkMode}
                        onClick={() => console.log(`Task clicked: ${task.title}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {completedTasks.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Completed
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        darkMode={darkMode}
                        onClick={() => console.log(`Task clicked: ${task.title}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
              <ListTodo className={`h-12 w-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                No tasks found
              </h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                {searchTerm ? 'Try adjusting your search or filters' : 'Create your first task to get started!'}
              </p>
            </div>
          )}
        </div> */}

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            <Column
              title="Pending"
              tasks={pendingTasks}
              status="PENDING"
              darkMode={darkMode}
              onDelete={handleDelete}
            />
            <Column
              title="In Progress"
              tasks={inProgressTasks}
              status="IN_PROGRESS"
              darkMode={darkMode}
              onDelete={handleDelete}
            />
            <Column
              title="Completed"
              tasks={completedTasks}
              status="COMPLETED"
              darkMode={darkMode}
              onDelete={handleDelete}
            />
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}



