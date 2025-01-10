import { useState, useRef } from 'react';
import { Button } from './button';
import { Image, Loader2 } from 'lucide-react';
import backend from '../../services/backend';

interface ImageUploadButtonProps {
  onImageSelect: (imageUrls: string[]) => void;
  uploadedImages: string[];
}

export function ImageUploadButton({
  onImageSelect,
  uploadedImages,
}: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const auth = localStorage.getItem('jwt');
    const files = event.target.files;
    if (!files) return;

    if (uploadedImages.length + files.length > 4) {
      alert('Maximum 4 images allowed.');
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 4 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 4MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append('title', 'Image');
      formData.append('file', file);

      try {
        const response = await backend.post('/bucket', formData, {
          headers: {
            'content-type': 'multipart/form-data',
            Authorization: `Bearer ${auth}`,
          },
        });

        const data = await response.data;
        uploadedUrls.push(data.url);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload image: ${file.name}`);
      }
    }

    setIsUploading(false);
    if (uploadedUrls.length > 0) {
      onImageSelect([...uploadedImages, ...uploadedUrls]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (uploadedImages.length >= 4) {
      alert('Maximum 4 images allowed.');
      return;
    }
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
        multiple
      />
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleButtonClick}
        disabled={isUploading || uploadedImages.length >= 4}
        className="border-gray-200 hover:bg-gray-100"
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
        ) : (
          <Image className="h-3.5 w-3.5 md:h-4 md:w-4" />
        )}
      </Button>
    </>
  );
}
