'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AgentSidebarProps {
  selectedAgentId?: Id<'agents'> | null;
  onAgentClick?: (agentId: Id<'agents'>) => void;
}

interface PopoverState {
  agentId: string;
  top: number;
  left: number;
}

export default function AgentSidebar({ selectedAgentId, onAgentClick }: AgentSidebarProps) {
  const agents = useQuery(api.agents.list);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    if (popover) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popover]);

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
        return 'bg-green-500 dark:bg-green-400 animate-pulse';
      case 'idle':
        return 'bg-gray-400 dark:bg-gray-500';
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

  const handleInfoClick = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    if (popover?.agentId === agentId) {
      setPopover(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({
      agentId,
      top: rect.top,
      left: rect.right + 8,
    });
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

  const openAgent = popover ? agents.find(a => a._id === popover.agentId) : null;
  const lastSeen = openAgent?.lastHeartbeat
    ? (() => {
        const diff = Math.floor((Date.now() - openAgent.lastHeartbeat!) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
      })()
    : 'never';

  return (
    <>
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
            const isInfoOpen = popover?.agentId === agent._id;
            return (
              <div key={agent._id} className="relative group">
                <div
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
                        <div className="flex items-center gap-1">
                          {/* Info icon — visible on hover */}
                          <button
                            onClick={(e) => handleInfoClick(e, agent._id)}
                            className={`transition-opacity text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 leading-none ${
                              isInfoOpen ? 'opacity-100 text-blue-500 dark:text-blue-400' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title="Agent info"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getRoleBadgeColor(getRoleBadge(agent.role))}`}>
                            {getRoleBadge(agent.role)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(agent.status)}`}></div>
                        <span className={`text-[10px] font-medium uppercase ${
                          agent.status === 'active'
                            ? 'text-green-600 dark:text-green-400'
                            : agent.status === 'blocked'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {agent.status === 'active' ? 'WORKING' : agent.status === 'blocked' ? 'BLOCKED' : 'IDLE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Popover rendered in portal to escape overflow clipping */}
      {popover && openAgent && createPortal(
        <div
          ref={popoverRef}
          style={{ top: popover.top, left: popover.left }}
          className="fixed z-[9999] w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl p-3"
        >
          {/* Arrow */}
          <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white dark:bg-slate-800 border-l border-b border-gray-200 dark:border-slate-600 rotate-45" />

          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {getInitials(openAgent.name)}
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{openAgent.name}</div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getRoleBadgeColor(getRoleBadge(openAgent.role))}`}>
                {getRoleBadge(openAgent.role)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wide text-[10px]">Role</span>
              <p className="text-gray-700 dark:text-gray-300 mt-0.5">{openAgent.role}</p>
            </div>
            <div>
              <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wide text-[10px]">Session</span>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono text-[10px] break-all">{openAgent.sessionKey}</p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-700">
              <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wide text-[10px]">Last seen</span>
              <span className="text-gray-600 dark:text-gray-400 text-[10px]">{lastSeen}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
