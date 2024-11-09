// src/components/TaskCard.tsx
'use client'

import { Task, Status, Priority } from '@prisma/client';
import { format } from 'date-fns';
import { updateTaskStatus, deleteTask } from '@/app/actions';
import { Clock, Trash2, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const statusColors = {
    PENDING: 'bg-yellow-50 border-yellow-200',
    IN_PROGRESS: 'bg-blue-50 border-blue-200',
    COMPLETED: 'bg-green-50 border-green-200',
  };

  const priorityConfig = {
    LOW: { color: 'bg-gray-100 text-gray-600', icon: null },
    MEDIUM: { color: 'bg-blue-100 text-blue-600', icon: null },
    HIGH: { color: 'bg-red-100 text-red-600', icon: <AlertCircle className="h-4 w-4" /> },
  };

  const handleStatusChange = async (newStatus: Status) => {
    await updateTaskStatus(task.id, newStatus);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${statusColors[task.status]} transition-all hover:shadow-md`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${priorityConfig[task.priority].color}`}>
            {priorityConfig[task.priority].icon}
            <span>{task.priority}</span>
          </div>
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-600">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            className="text-sm rounded-lg border-gray-200 bg-white px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.values(Status).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          
          <div className="flex items-center space-x-4">
            {task.dueDate && (
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </div>
            )}
            
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}