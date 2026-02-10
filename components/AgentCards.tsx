'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Activity, Heart, Clock, User as UserIcon } from 'lucide-react';

export default function AgentCards() {
  const agents = useQuery(api.agents.list);

  if (!agents) {
    return (
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-semibold mb-4'>Agents</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[1, 2].map((i) => (
            <div key={i} className='animate-pulse'>
              <div className='h-24 bg-gray-200 rounded-lg'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') {
      return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-200 animate-pulse';
    }
    if (status === 'blocked') {
      return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400';
  };

  const formatLastHeartbeat = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + 'm ago';
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return diffHours + 'h ago';
    const diffDays = Math.floor(diffMs / 86400000);
    return diffDays + 'd ago';
  };

  const getHealthIndicator = (lastHeartbeat: number) => {
    const now = Date.now();
    const diffMs = now - lastHeartbeat;
    const diffMins = diffMs / 60000;

    if (diffMins < 20) return 'bg-green-500';
    if (diffMins < 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <h2 className='text-lg font-semibold mb-4'>Agents</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {agents.map((agent) => (
          <div key={agent._id} className='bg-white rounded-lg shadow border-2 p-4 hover:border-blue-300 transition-colors'>
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <div className={'h-3 w-3 rounded-full ' + getHealthIndicator(agent.lastHeartbeat ?? 0)} />
                <h3 className='font-semibold text-lg'>{agent.name}</h3>
              </div>
              <span className={'px-2 py-1 rounded-full text-xs font-medium border ' + getStatusColor(agent.status)}>
                {agent.status.toUpperCase()}
              </span>
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center space-x-2 text-gray-600'>
                <UserIcon className='h-4 w-4' />
                <span>{agent.role}</span>
              </div>
              <div className='flex items-center space-x-2 text-gray-600'>
                <Heart className='h-4 w-4' />
                <span>Last heartbeat: {formatLastHeartbeat(agent.lastHeartbeat ?? 0)}</span>
              </div>
              {agent.currentTaskId && (
                <div className='flex items-center space-x-2 text-blue-600'>
                  <Activity className='h-4 w-4' />
                  <span>Working on task</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
