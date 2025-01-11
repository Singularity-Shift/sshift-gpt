import { useState, useEffect } from 'react';
import systemPrompt from '../../../config/systemPrompt.json';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPrompt: string) => void;
}

export const PromptEditor = ({ isOpen, onClose, onSave }: PromptEditorProps) => {
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the editor with the current system prompt
    if (isOpen) {
      // Fetch the latest system prompt when opening
      fetch('/api/reloadSystemPrompt', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          setEditedContent(data.systemPrompt.content);
        })
        .catch(error => {
          console.error('Error loading system prompt:', error);
          setEditedContent(systemPrompt.content); // Fallback to imported content
        });
      setSaveError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await onSave(editedContent);
      onClose();
      // Force a page reload to ensure all components get the new system prompt
      window.location.reload();
    } catch (error) {
      console.error('Error saving:', error);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg w-full max-w-[1200px] h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Edit System Prompt</h2>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full p-6 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ 
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              minHeight: 'calc(90vh - 140px)'
            }}
          />
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          {saveError && (
            <div className="text-red-500 text-sm">{saveError}</div>
          )}
          {isSaving && (
            <div className="text-gray-500">Saving changes...</div>
          )}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-md hover:bg-gray-100"
              disabled={isSaving}
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-green-400"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Accept Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 