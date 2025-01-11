import { useState, useEffect } from 'react';
import systemPrompt from '../../config/systemPrompt.json';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPrompt: string) => void;
}

export const PromptEditor = ({ isOpen, onClose, onSave }: PromptEditorProps) => {
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    // Initialize the editor with the current system prompt
    if (isOpen) {
      setEditedContent(systemPrompt.content);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editedContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[595px] h-[842px] flex flex-col"> {/* A4 size in pixels */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Edit System Prompt</h2>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ 
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          />
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-md hover:bg-gray-100"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
          >
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
}; 