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
    <div className="w-full bg-background border-t border-border flex-shrink-0">
      <div className="max-w-6xl mx-auto px-2 py-2 md:px-4 md:py-3">
        {uploadedImages.length > 0 && (
          <div className="flex gap-1 items-center mb-2">
            {uploadedImages.map((url, index) => (
              <div key={url} className="relative flex-shrink-0">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="h-5 w-5 md:h-6 md:w-6 object-cover rounded-full border border-gray-300"
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
        <div className="flex gap-1.5 md:gap-2 items-end">
          <div className="flex-1 min-h-0">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              className="resize-none min-h-[45px] max-h-[120px]"
            />
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
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
