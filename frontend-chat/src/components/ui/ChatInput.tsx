import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Image, Send, Upload, X } from 'lucide-react';
import { StopButton } from './StopButton';
import { SendButton } from './SendButton';

interface ChatInputProps {
  onSendMessage: (message: string, imageUrl: string | null) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.error('No file selected');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (PNG, JPEG, WebP, or GIF).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch('/api/bucket', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setUploadedFile(data.url);
      setSelectedImage(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() || selectedImage) {
      onSendMessage(inputMessage, selectedImage);
      setInputMessage('');
      setSelectedImage(null);
      setUploadedFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRemoveUploadedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    setSelectedImage(null);
  };

  const handleStop = () => {
    console.log('Stop button clicked');
    // Implement stop functionality here
  };

  return (
    <div className="border-t border-border p-4 w-full relative">
      <div className="flex items-end space-x-2 max-w-6xl mx-auto">
        <div className="relative flex-1">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here... (Ctrl+Enter to send)"
            className="flex-1"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageChange}
        />
        <div className="flex flex-col items-center">
          {uploadedFile && (
            <div className="mb-2 relative">
              <img
                src={uploadedFile}
                alt="Uploaded Preview"
                className="h-12 w-12 rounded border border-gray-300"
              />
              <button
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                onClick={handleRemoveUploadedFile}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 hover:bg-gray-200"
            onClick={handleImageButtonClick}
            disabled={uploading}
          >
            {uploading ? (
              <Upload className="animate-spin h-4 w-4" />
            ) : (
              <Image className="h-4 w-4" />
            )}
          </Button>
        </div>
        <StopButton onStop={handleStop} />
        <SendButton onClick={handleSendMessage} />
      </div>
    </div>
  );
};