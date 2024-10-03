import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Image, Send, Upload } from 'lucide-react';
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
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 hover:bg-gray-200 relative"
          onClick={handleImageButtonClick}
          disabled={uploading}
        >
          {uploading ? (
            <Upload className="animate-spin h-4 w-4" />
          ) : (
            <Image className="h-4 w-4" />
          )}
          {uploadedFile && (
            <div className="absolute top-[-40px] right-0 flex items-center">
              <img
                src={uploadedFile}
                alt="Uploaded Preview"
                className="h-8 w-8 rounded border border-gray-300"
              />
              <button
                className="ml-2 text-red-500"
                onClick={handleRemoveUploadedFile}
              >
                &times;
              </button>
            </div>
          )}
        </Button>
        <StopButton onStop={handleStop} />
        <SendButton onClick={handleSendMessage} />
      </div>
    </div>
  );
};