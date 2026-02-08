'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Clock, User } from 'lucide-react';

const COLUMNS = [
  { id: 'inbox', title: 'INBOX', color: 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900' },
  { id: 'assigned', title: 'ASSIGNED', color: 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30' },
  { id: 'in_progress', title: 'IN PROGRESS', color: 'border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30' },
  { id: 'review', title: 'REVIEW', color: 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30' },
  { id: 'done', title: 'DONE', color: 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900' },
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
        return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-slate-700';
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
    <main className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">MISSION QUEUE</h2>
          <span className="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full font-bold">
            {activeTasks} Active
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-3">
        <div className="flex gap-2 h-full">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksForColumn(column.id);
            return (
              <div
                key={column.id}
                className={`flex-1 min-w-[180px] max-w-[240px] rounded-lg border-2 ${column.color} flex flex-col shadow-sm overflow-hidden`}
              >
                {/* Column Header */}
                <div className="p-5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                      {column.title}
                    </h3>
                    <span className="text-sm px-3 py-1 bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 rounded-full font-bold text-gray-800 dark:text-gray-200 shadow-sm">
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
                      className="w-full bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-3 cursor-pointer hover:shadow-lg transition-all hover:border-blue-400 dark:hover:border-blue-500 overflow-hidden"
                    >
                      {/* Task Title & Priority */}
                      <div className="flex items-start justify-between mb-2 gap-2 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex-1 pr-2 line-clamp-2 leading-snug overflow-hidden">
                          {task.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-md border-2 font-bold ${getPriorityColor(task.priority)} shadow-sm flex-shrink-0`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed overflow-hidden break-words">
                        {task.description}
                      </p>

                      {/* Tags - only show if task has tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 w-full overflow-hidden">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium truncate max-w-[80px]"
                              title={tag}
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-gray-400 rounded text-xs font-medium">
                              +{task.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: Assignee & Time */}
                      <div className="flex flex-col gap-2 text-xs pt-2 border-t border-gray-100 dark:border-slate-700">
                        {/* Assignee */}
                        {task.assignees && task.assignees.length > 0 && task.assignees[0] ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0">
                              {getInitials(task.assignees[0].name)}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                              {task.assignees[0].name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                            <User className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="font-medium text-xs">Unassigned</span>
                          </div>
                        )}
                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium text-xs">{formatTimestamp(task.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center text-gray-400 dark:text-gray-500 py-12 font-medium">
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
