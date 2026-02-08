'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function AgentSidebar() {
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
        return 'bg-blue-500';
      case 'idle':
        return 'bg-green-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getRoleBadgeColor = (badge: string) => {
    switch (badge) {
      case 'LEAD':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'INT':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'SPC':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
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
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">AGENTS</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">AGENTS</h2>
          <span className="text-sm px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
            {agents.length}
          </span>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {agents.map((agent) => (
          <div
            key={agent._id}
            className="p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
          >
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-base shadow-md">
                  {getInitials(agent.name)}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {agent.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded border font-semibold ${getRoleBadgeColor(getRoleBadge(agent.role))}`}>
                    {getRoleBadge(agent.role)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(agent.status)} shadow-sm`}></div>
                  <span className="text-sm text-gray-700 font-medium capitalize">{agent.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
