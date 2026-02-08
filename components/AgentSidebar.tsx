'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface AgentSidebarProps {
  selectedAgentId?: Id<'agents'> | null;
  onAgentClick?: (agentId: Id<'agents'>) => void;
}

export default function AgentSidebar({ selectedAgentId, onAgentClick }: AgentSidebarProps) {
  const agents = useQuery(api.agents.list);

  const getRoleBadge = (role: string) => {
    const roleUpper = role.toUpperCase();
    if (roleUpper.includes('LEAD')) return 'LEAD';
    if (roleUpper.includes('INT') || roleUpper.includes('INTEL')) return 'INT';
    if (roleUpper.includes('SPEC') || roleUpper.includes('SPC')) return 'SPC';
    return 'AGT';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-slate-400 dark:bg-slate-500';
      case 'idle':
        return 'bg-zinc-400 dark:bg-zinc-500';
      case 'blocked':
        return 'bg-red-400 dark:bg-red-500';
      default:
        return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  const getRoleBadgeColor = (badge: string) => {
    switch (badge) {
      case 'LEAD':
        return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800';
      case 'INT':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800';
      case 'SPC':
        return 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800';
      default:
        return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-slate-700';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!agents) {
    return (
      <aside className="w-48 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">AGENTS</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-slate-800 h-20 rounded-lg"></div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-48 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Agents
          </h2>
          <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs font-medium">
            {agents.length}
          </span>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {agents.map((agent) => {
          const isSelected = selectedAgentId === agent._id;
          return (
            <div
              key={agent._id}
              onClick={() => onAgentClick?.(agent._id)}
              className={`p-1.5 bg-white dark:bg-slate-800 rounded border cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 dark:border-blue-400 shadow-sm bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white font-bold text-xs">
                    {getInitials(agent.name)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                      {agent.name}
                    </h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getRoleBadgeColor(getRoleBadge(agent.role))}`}>
                      {getRoleBadge(agent.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(agent.status)}`}></div>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium uppercase">
                      {agent.status === 'active' ? 'WORKING' : 'IDLE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
