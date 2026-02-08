'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { FileText } from 'lucide-react';

interface StatsBarProps {
  onDocsClick?: () => void;
}

export default function StatsBar({ onDocsClick }: StatsBarProps) {
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const date = now.getDate();
      setCurrentTime(`${hours}:${minutes}:${seconds} ${dayName} ${monthName} ${date}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeAgents = agents?.filter(a => a.status === 'active' || a.status === 'idle').length || 0;
  const tasksInQueue = tasks?.filter(t => t.status !== 'done').length || 0;

  return (
    <div className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm">
      {/* Left: Title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">MISSION CONTROL</h1>
        <span className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md font-semibold">SiteGPT</span>
      </div>

      {/* Center: Stats */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <span className="text-gray-600 font-medium text-sm">AGENTS ACTIVE:</span>
          <span className="text-2xl font-bold text-blue-600">{activeAgents}</span>
        </div>
        <div className="w-px h-8 bg-gray-300"></div>
        <div className="flex items-center space-x-3">
          <span className="text-gray-600 font-medium text-sm">TASKS IN QUEUE:</span>
          <span className="text-2xl font-bold text-blue-600">{tasksInQueue}</span>
        </div>
      </div>

      {/* Right: Time & Actions */}
      <div className="flex items-center space-x-6">
        <div className="text-sm font-mono text-gray-600 font-medium">{currentTime}</div>
        <div className="flex items-center space-x-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-semibold text-green-600">ONLINE</span>
        </div>
        <button
          onClick={onDocsClick}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-900 transition-colors cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          <span>Docs</span>
        </button>
      </div>
    </div>
  );
}
