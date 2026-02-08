'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Clock, User } from 'lucide-react';

const COLUMNS = [
  { id: 'inbox', title: 'INBOX', color: 'border-gray-300 bg-gray-50' },
  { id: 'assigned', title: 'ASSIGNED', color: 'border-blue-300 bg-blue-50' },
  { id: 'in_progress', title: 'IN PROGRESS', color: 'border-yellow-300 bg-yellow-50' },
  { id: 'review', title: 'REVIEW', color: 'border-purple-300 bg-purple-50' },
  { id: 'done', title: 'DONE', color: 'border-green-300 bg-green-50' },
];

interface MissionQueueProps {
  onTaskClick?: (taskId: Id<'tasks'>) => void;
}

export default function MissionQueue({ onTaskClick }: MissionQueueProps) {
  const tasks = useQuery(api.tasks.list);

  const getTasksForColumn = (status: string) => {
    if (!tasks) return [];
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'U';
      case 'high':
        return 'H';
      case 'medium':
        return 'M';
      case 'low':
        return 'L';
      default:
        return '?';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const activeTasks = tasks?.filter(t => t.status !== 'done').length || 0;

  return (
    <main className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-8 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">MISSION QUEUE</h2>
          <span className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-bold">
            {activeTasks} Active
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-8">
        <div className="flex gap-6 h-full min-w-max">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksForColumn(column.id);
            return (
              <div
                key={column.id}
                className={`flex-shrink-0 w-96 rounded-xl border-2 ${column.color} flex flex-col shadow-sm`}
              >
                {/* Column Header */}
                <div className="p-5 border-b border-gray-200 bg-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                      {column.title}
                    </h3>
                    <span className="text-sm px-3 py-1 bg-white border-2 border-gray-300 rounded-full font-bold text-gray-800 shadow-sm">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {columnTasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => onTaskClick?.(task._id)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-all hover:border-blue-400 hover:-translate-y-0.5"
                    >
                      {/* Task Title & Priority */}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-base text-gray-900 flex-1 pr-3 line-clamp-2 leading-snug">
                          {task.title}
                        </h4>
                        <span className={`text-sm px-2.5 py-1 rounded-md border-2 font-bold ${getPriorityColor(task.priority)} shadow-sm`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                        {task.description}
                      </p>

                      {/* Footer: Assignee & Time */}
                      <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                        {task.assignees && task.assignees.length > 0 && task.assignees[0] ? (
                          <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {getInitials(task.assignees[0].name)}
                            </div>
                            <span className="text-gray-800 font-semibold truncate max-w-[140px]">
                              {task.assignees[0].name.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-gray-400">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Unassigned</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1.5 text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-medium">{formatTimestamp(task.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center text-gray-400 py-12 font-medium">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
