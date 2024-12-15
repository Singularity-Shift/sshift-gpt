import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Image, Send, Upload, X } from 'lucide-react';
import { StopButton } from './StopButton';
import { SendButton } from './SendButton';
import { ImageUploadButton } from './ImageUploadButton';

interface ChatInputProps {
  onSendMessage: (message: string, imageUrls: string[]) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleSendMessage = () => {
    if (inputMessage.trim() || uploadedImages.length > 0) {
      onSendMessage(inputMessage, uploadedImages);
      setInputMessage('');
      setUploadedImages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(uploadedImages.filter((_, index) => index !== indexToRemove));
  };

  const handleStop = () => {
    console.log('Stop button clicked');
  };

  return (
    <div className="border-t border-border p-4 w-full relative">
      <div className="max-w-6xl mx-auto relative">
        {uploadedImages.length > 0 && (
          <div className="absolute right-14 top-0 transform -translate-y-full flex gap-1 items-center">
            {uploadedImages.map((url, index) => (
              <div key={url} className="relative flex-shrink-0">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="h-8 w-8 object-cover rounded-full border border-gray-300"
                />
                <button
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              className="resize-none"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ImageUploadButton
              onImageSelect={setUploadedImages}
              uploadedImages={uploadedImages}
            />
            <StopButton onStop={handleStop} />
            <SendButton onClick={handleSendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
};
