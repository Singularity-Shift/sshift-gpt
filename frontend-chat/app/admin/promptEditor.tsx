import { useEffect, useState } from 'react';
import systemPrompt from '../../config/systemPrompt.json';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromptEditor = ({ isOpen, onClose }: PromptEditorProps) => {
  const [promptContent, setPromptContent] = useState(systemPrompt.content);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      const maxHeight = window.innerHeight * 0.9; // 90% of viewport height
      const maxWidth = window.innerWidth * 0.9; // 90% of viewport width
      
      // Use a wider ratio (16:10) for better readability
      const width = maxWidth;
      const height = maxHeight;
      
      setDimensions({ width, height });
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        style={{ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px`,
        }}
        className="bg-white rounded-lg shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold">Edit System Prompt</h2>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <textarea
            value={promptContent}
            onChange={(e) => setPromptContent(e.target.value)}
            className="w-full h-full p-4 border rounded-lg resize-none font-mono text-sm"
            style={{ 
              minHeight: '100%',
              lineHeight: '1.6',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Discard Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor; 