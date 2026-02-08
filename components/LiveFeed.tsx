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
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'message_sent':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'task_created':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'task_assigned':
        return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      case 'task_status_changed':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-gray-500" />;
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
      <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">LIVE FEED</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
          ))}
        </div>
      </aside>
    );
  }

  const filteredActivities = filterActivities(activities);

  return (
    <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4">LIVE FEED</h2>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`text-sm px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center text-gray-400 py-12 font-medium">
            No recent activity
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity._id}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all cursor-pointer hover:shadow-md hover:border-blue-300"
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                {activity.agent && (
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {getInitials(activity.agent.name)}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug flex-1">
                      {activity.message}
                    </p>
                    <div className="flex-shrink-0 ml-2">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  
                  {activity.agent && (
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      by {activity.agent.name}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-bold ${
                      isLive(activity.createdAt) ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {formatTimestamp(activity.createdAt)}
                    </p>
                    {isLive(activity.createdAt) && (
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-sm"></div>
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
