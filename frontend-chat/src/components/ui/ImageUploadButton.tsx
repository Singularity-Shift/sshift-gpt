import { useState, useRef } from 'react';
import { Button } from './button';
import { Image } from 'lucide-react';

interface ImageUploadButtonProps {
  onImageSelect: (imageUrl: string) => void;
}

export function ImageUploadButton({ onImageSelect }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds 4MB.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/bucket', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        onImageSelect(data.url);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image.');
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <Button variant="ghost" size="icon" onClick={handleButtonClick}>
        <Image className="h-4 w-4" />
      </Button>
    </>
  );
}
