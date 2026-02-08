'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Heart, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'comments', label: 'Comments' },
  { id: 'status', label: 'Status' },
];

export default function LiveFeed() {
  const [activeFilter, setActiveFilter] = useState('all');
  const activities = useQuery(api.activities.recent, { limit: 50 });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'agent_heartbeat':
        return <Heart className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'message_sent':
        return <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      case 'task_created':
        return <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'task_assigned':
        return <CheckCircle2 className="h-5 w-5 text-purple-500 dark:text-purple-400" />;
      case 'task_status_changed':
        return <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffSecs < 30) return 'LIVE';
    if (diffMins < 1) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  const isLive = (timestamp: number) => {
    const now = Date.now();
    return (now - timestamp) < 30000;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filterActivities = (activities: any[]) => {
    if (activeFilter === 'all') return activities;
    if (activeFilter === 'tasks') {
      return activities.filter(a => 
        a.type.includes('task') || a.type === 'task_created' || a.type === 'task_assigned' || a.type === 'task_status_changed'
      );
    }
    if (activeFilter === 'comments') {
      return activities.filter(a => a.type === 'message_sent');
    }
    if (activeFilter === 'status') {
      return activities.filter(a => a.type === 'agent_heartbeat' || a.type === 'task_status_changed');
    }
    return activities;
  };

  if (!activities) {
    return (
      <aside className="w-64 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 flex flex-col">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">LIVE FEED</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-slate-800 h-24 rounded-lg"></div>
          ))}
        </div>
      </aside>
    );
  }

  const filteredActivities = filterActivities(activities);

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">LIVE FEED</h2>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-gray-900 dark:bg-slate-700 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredActivities.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-xs font-medium">
            No recent activity
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity._id}
              className="p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-700 transition-all cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600"
            >
              <div className="flex items-start gap-2">
                {/* Avatar */}
                {activity.agent && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white font-bold text-xs shadow-md">
                      {getInitials(activity.agent.name)}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug flex-1">
                      {activity.message}
                    </p>
                    <div className="flex-shrink-0 ml-1.5">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>

                  {activity.agent && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 font-medium">
                      by {activity.agent.name}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-bold ${
                      isLive(activity.createdAt) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTimestamp(activity.createdAt)}
                    </p>
                    {isLive(activity.createdAt) && (
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse shadow-sm"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
