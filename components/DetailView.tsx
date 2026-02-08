'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { X, Send, Clock, User } from 'lucide-react';

interface DetailViewProps {
  taskId: Id<'tasks'> | null;
  onClose: () => void;
}

export default function DetailView({ taskId, onClose }: DetailViewProps) {
  const [newMessage, setNewMessage] = useState('');
  const task = useQuery(api.tasks.get, taskId ? { taskId } : 'skip');
  const messages = useQuery(api.messages.byTask, taskId ? { taskId } : 'skip');
  const updateStatus = useMutation(api.tasks.updateStatus);

  if (!taskId || !task) return null;

  const handleStatusChange = async (newStatus: any) => {
    await updateStatus({ taskId, status: newStatus });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inbox':
        return 'bg-gray-100 text-gray-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='border-b p-4 flex items-start justify-between'>
          <div className='flex-1 pr-4'>
            <h2 className='text-xl font-semibold mb-2'>{task.title}</h2>
            <div className='flex items-center space-x-3 text-sm text-gray-600'>
              <span className={'px-2 py-1 rounded ' + getStatusColor(task.status)}>
                {task.status}
              </span>
              {task.priority && (
                <span className='text-gray-500'>Priority: {task.priority}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1 hover:bg-gray-100 rounded transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          <div>
            <h3 className='font-medium text-sm text-gray-700 mb-2'>Description</h3>
            <p className='text-sm text-gray-600'>{task.description}</p>
          </div>

          {task.assignees && task.assignees.length > 0 && task.assignees[0] && (
            <div>
              <h3 className='font-medium text-sm text-gray-700 mb-2'>Assigned To</h3>
              <div className='flex items-center space-x-2'>
                <User className='h-4 w-4 text-gray-500' />
                <span className='text-sm'>{task.assignees[0].name}</span>
              </div>
            </div>
          )}

          <div>
            <h3 className='font-medium text-sm text-gray-700 mb-2'>Discussion</h3>
            <div className='space-y-3 max-h-64 overflow-y-auto'>
              {messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message._id} className='bg-gray-50 rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='font-medium text-sm'>{String(message.fromAgentId)}</span>
                      <div className='flex items-center space-x-1 text-xs text-gray-500'>
                        <Clock className='h-3 w-3' />
                        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <p className='text-sm text-gray-700'>{message.content}</p>
                  </div>
                ))
              ) : (
                <p className='text-sm text-gray-500 italic'>No messages yet</p>
              )}
            </div>
          </div>
        </div>

        <div className='border-t p-4 space-y-3'>
          <div className='flex space-x-2'>
            <input
              type='text'
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder='Type a message...'
              className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
            >
              <Send className='h-4 w-4' />
            </button>
          </div>

          <div className='flex space-x-2'>
            {task.status !== 'in_progress' && task.status !== 'review' && task.status !== 'done' && (
              <button
                onClick={() => handleStatusChange('in_progress')}
                className='flex-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium'
              >
                Start Working
              </button>
            )}
            {task.status !== 'review' && task.status !== 'done' && (
              <button
                onClick={() => handleStatusChange('review')}
                className='flex-1 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium'
              >
                Request Review
              </button>
            )}
            {task.status !== 'done' && (
              <button
                onClick={() => handleStatusChange('done')}
                className='flex-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium'
              >
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
