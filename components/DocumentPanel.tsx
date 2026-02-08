'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { FileText, Download, Trash2, Upload } from 'lucide-react';

export default function DocumentPanel() {
  const documents = useQuery(api.documents.list);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      console.log('Uploading file:', file.name);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (docId: Id<'documents'>) => {
    console.log('Downloading document:', docId);
  };

  const handleDelete = (docId: Id<'documents'>) => {
    console.log('Deleting document:', docId);
  };

  if (!documents) {
    return (
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-semibold mb-4'>Documents</h2>
        <div className='animate-pulse space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-16 bg-gray-200 rounded'></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold'>Documents</h2>
        <label className='cursor-pointer'>
          <div className='flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors'>
            <Upload className='h-4 w-4' />
            <span>Upload</span>
          </div>
          <input
            type='file'
            className='hidden'
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>
      <div className='space-y-3'>
        {documents.length === 0 ? (
          <div className='text-center text-gray-500 py-8'>
            <FileText className='h-12 w-12 mx-auto mb-2 text-gray-300' />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc._id}
              className='flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <div className='flex items-center space-x-3 flex-1 min-w-0'>
                <FileText className='h-8 w-8 text-blue-500 flex-shrink-0' />
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-sm truncate'>{doc.title}</p>
                  <div className='flex items-center space-x-2 text-xs text-gray-500'>
                    <span>{doc.type.toString()}</span>
                    <span>-</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className='flex items-center space-x-2 ml-4'>
                <button
                  onClick={() => handleDownload(doc._id)}
                  className='p-2 hover:bg-gray-100 rounded transition-colors'
                  title='Download'
                >
                  <Download className='h-4 w-4 text-gray-600' />
                </button>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className='p-2 hover:bg-red-100 rounded transition-colors'
                  title='Delete'
                >
                  <Trash2 className='h-4 w-4 text-red-600' />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
