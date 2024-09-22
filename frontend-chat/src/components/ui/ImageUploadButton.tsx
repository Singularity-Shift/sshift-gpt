import { useState, useRef } from 'react';
import { Button } from './button';
import { Image } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ImageUploadButtonProps {
  onImageSelect: (imageData: string) => void;
}

export function ImageUploadButton({ onImageSelect }: ImageUploadButtonProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setSelectedImage(base64String);
          onImageSelect(base64String);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
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
      <Button
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
        className={selectedImage ? 'text-primary' : ''}
      >
        <Image className="h-4 w-4" />
      </Button>
    </>
  );
}
