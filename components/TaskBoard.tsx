'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Clock, User } from 'lucide-react';

const COLUMNS = [
  { id: 'inbox', title: 'Inbox', color: 'bg-gray-100 border-gray-300' },
  { id: 'assigned', title: 'Assigned', color: 'bg-blue-100 border-blue-300' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'review', title: 'Review', color: 'bg-purple-100 border-purple-300' },
  { id: 'done', title: 'Done', color: 'bg-green-100 border-green-300' },
];

interface TaskBoardProps {
  onTaskClick?: (taskId: Id<'tasks'>) => void;
}

export default function TaskBoard({ onTaskClick }: TaskBoardProps) {
  const tasks = useQuery(api.tasks.list);

  const getTasksForColumn = (status: string) => {
    if (!tasks) return [];
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <h2 className='text-lg font-semibold mb-4'>Task Board</h2>
      <div className='flex space-x-4 overflow-x-auto pb-4'>
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className={'flex-shrink-0 w-80 rounded-lg border-2 p-4 ' + column.color}
          >
            <h3 className='font-semibold mb-3 flex items-center justify-between'>
              {column.title}
              <span className='text-sm bg-white px-2 py-1 rounded'>
                {getTasksForColumn(column.id).length}
              </span>
            </h3>
            <div className='space-y-3'>
              {getTasksForColumn(column.id).map((task) => (
                <div
                  key={task._id}
                  onClick={() => onTaskClick?.(task._id)}
                  className='bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <h4 className='font-medium text-sm flex-1 pr-2'>
                      {task.title}
                    </h4>
                    <span className={'text-xs px-2 py-1 rounded border ' + getPriorityColor(task.priority)}>
                      {task.priority}
                    </span>
                  </div>
                  <p className='text-xs text-gray-600 line-clamp-2 mb-2'>
                    {task.description}
                  </p>
                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    {task.assignees && task.assignees.length > 0 && task.assignees[0] && (
                      <div className='flex items-center space-x-1'>
                        <User className='h-3 w-3' />
                        <span>{task.assignees[0].name}</span>
                      </div>
                    )}
                    <div className='flex items-center space-x-1'>
                      <Clock className='h-3 w-3' />
                      <span>{formatTimestamp(task.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {getTasksForColumn(column.id).length === 0 && (
                <div className='text-center text-sm text-gray-500 py-4'>
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
