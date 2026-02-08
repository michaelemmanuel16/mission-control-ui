'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { FileText } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

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
    <div className="h-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 flex items-center justify-between shadow-sm">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">MISSION CONTROL</h1>
      </div>

      {/* Center: Large Stats Display */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-900 dark:text-gray-100">{activeAgents}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mt-1">
            Agents Active
          </div>
        </div>
        <div className="w-px h-10 bg-gray-200 dark:bg-slate-700"></div>
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-900 dark:text-gray-100">{tasksInQueue}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mt-1">
            Tasks in Queue
          </div>
        </div>
      </div>

      {/* Right: Time & Actions */}
      <div className="flex items-center gap-4">
        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 font-medium">{currentTime}</div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">ONLINE</span>
        </div>
        <button
          onClick={onDocsClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Docs</span>
        </button>
        <ThemeToggle />
      </div>
    </div>
  );
}
