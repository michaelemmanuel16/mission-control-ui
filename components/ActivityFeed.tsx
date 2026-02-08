'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Activity, Heart, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

interface ActivityFeedProps {
  limit?: number;
}

export default function ActivityFeed({ limit = 20 }: ActivityFeedProps) {
  const activities = useQuery(api.activities.recent, { limit });

  if (!activities) {
    return (
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-semibold mb-4'>Activity Feed</h2>
        <div className='animate-pulse flex space-x-4'>
          <div className='flex-1 space-y-4 py-1'>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded w-5/6'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-semibold mb-4'>Activity Feed</h2>
        <p className='text-gray-500 text-sm'>No recent activity</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'agent_heartbeat':
        return <Heart className='h-4 w-4 text-red-500' />;
      case 'message_sent':
        return <MessageSquare className='h-4 w-4 text-blue-500' />;
      case 'task_created':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />;
      case 'task_assigned':
        return <CheckCircle2 className='h-4 w-4 text-purple-500' />;
      case 'task_status_changed':
        return <AlertCircle className='h-4 w-4 text-yellow-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'agent_heartbeat':
        return 'bg-red-50 border-red-200';
      case 'message_sent':
        return 'bg-blue-50 border-blue-200';
      case 'task_created':
        return 'bg-green-50 border-green-200';
      case 'task_assigned':
        return 'bg-purple-50 border-purple-200';
      case 'task_status_changed':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + 'm ago';
    if (diffHours < 24) return diffHours + 'h ago';
    if (diffDays < 7) return diffDays + 'd ago';
    return date.toLocaleDateString();
  };

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <h2 className='text-lg font-semibold mb-4'>Activity Feed</h2>
      <div className='space-y-3'>
        {activities.map((activity) => (
          <div
            key={activity._id}
            className={'flex items-start space-x-3 p-3 rounded-lg border ' + getActivityColor(activity.type)}
          >
            <div className='flex-shrink-0 mt-0.5'>
              {getActivityIcon(activity.type)}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-900'>
                {activity.message}
              </p>
              {activity.agent && (
                <p className='text-xs text-gray-600 mt-1'>
                  by {activity.agent.name}
                </p>
              )}
              <p className='text-xs text-gray-500 mt-1'>
                {formatTimestamp(activity.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
