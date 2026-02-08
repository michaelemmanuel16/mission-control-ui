'use client';

import { useState } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import StatsBar from '@/components/StatsBar';
import AgentSidebar from '@/components/AgentSidebar';
import MissionQueue from '@/components/MissionQueue';
import LiveFeed from '@/components/LiveFeed';
import DetailView from '@/components/DetailView';
import DocumentPanel from '@/components/DocumentPanel';

export default function Home() {
  const [selectedTaskId, setSelectedTaskId] = useState<Id<'tasks'> | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<Id<'agents'> | null>(null);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Stats Bar */}
      <StatsBar onDocsClick={() => setShowDocs(!showDocs)} />

      {/* Main 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Agents */}
        <AgentSidebar
          selectedAgentId={selectedAgentId}
          onAgentClick={setSelectedAgentId}
        />

        {/* Center Panel - Mission Queue */}
        <MissionQueue onTaskClick={setSelectedTaskId} />

        {/* Right Sidebar - Live Feed */}
        <LiveFeed />
      </div>

      {/* Detail View Modal */}
      {selectedTaskId && (
        <DetailView
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Document Panel Modal/Drawer */}
      {showDocs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <button
                onClick={() => setShowDocs(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <DocumentPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
