'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Clock, User } from 'lucide-react';

const COLUMNS = [
  { id: 'inbox', title: 'INBOX', color: 'border-gray-300 bg-gray-50' },
  { id: 'assigned', title: 'ASSIGNED', color: 'border-orange-300 bg-orange-50' },
  { id: 'in_progress', title: 'IN PROGRESS', color: 'border-teal-300 bg-teal-50' },
  { id: 'review', title: 'REVIEW', color: 'border-orange-300 bg-orange-50' },
  { id: 'done', title: 'DONE', color: 'border-gray-300 bg-gray-50' },
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
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
                      className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-lg transition-all hover:border-blue-400 overflow-hidden"
                    >
                      {/* Task Title & Priority */}
                      <div className="flex items-start justify-between mb-2 gap-2 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 flex-1 pr-2 line-clamp-2 leading-snug overflow-hidden">
                          {task.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-md border-2 font-bold ${getPriorityColor(task.priority)} shadow-sm flex-shrink-0`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed overflow-hidden break-words">
                        {task.description}
                      </p>

                      {/* Tags - only show if task has tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 w-full overflow-hidden">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium truncate max-w-[80px]"
                              title={tag}
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-500 rounded text-xs font-medium">
                              +{task.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: Assignee & Time */}
                      <div className="flex flex-col gap-2 text-xs pt-2 border-t border-gray-100">
                        {/* Assignee */}
                        {task.assignees && task.assignees.length > 0 && task.assignees[0] ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0">
                              {getInitials(task.assignees[0].name)}
                            </div>
                            <span className="text-xs text-gray-600 font-medium truncate">
                              {task.assignees[0].name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <User className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="font-medium text-xs">Unassigned</span>
                          </div>
                        )}
                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium text-xs">{formatTimestamp(task.createdAt)}</span>
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
