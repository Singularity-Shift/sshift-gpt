import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Image, Send, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { StopButton } from './StopButton'; // Import the StopButton

interface ChatInputProps {
  onSendMessage: (message: string, image: string | null) => void;
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
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload PNG, JPEG, WEBP, or GIF images.');
      return;
    }

    if (file.type === 'image/gif') {
      const isAnimated = await checkIfGifIsAnimated(file);
      if (isAnimated) {
        alert('Animated GIFs are not supported.');
        return;
      }
    }

    try {
      setUploading(true);
      const options = {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const base64 = await convertToBase64(compressedFile);
      setSelectedImage(base64);
      setUploadedFile(base64);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const checkIfGifIsAnimated = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 3);
        const header = arr.every((c, i) => c === [0x47, 0x49, 0x46][i]);
        if (!header) {
          resolve(false);
          return;
        }
        const view = new Uint8Array(e.target?.result as ArrayBuffer);
        for (let i = 0; i < view.length - 3; i++) {
          if (view[i] === 0x21 && view[i + 1] === 0xF9 && view[i + 2] === 0x04) {
            resolve(true);
            return;
          }
        }
        resolve(false);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleStop = async () => {
    await fetch('/api/chat', {
      method: 'DELETE',
    });
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
          accept=".png, .jpeg, .jpg, .webp, .gif"
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
        <StopButton onStop={handleStop} /> {/* Add StopButton here */}
        <Button
          onClick={handleSendMessage}
          className="shrink-0 hover:bg-gray-200"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
