import React, { useState } from 'react';
import { Download, Pencil } from 'lucide-react';
import backend from '../../services/backend';
import { useAuth } from '../../context/AuthProvider';
import { ImageEditModal } from './ImageEditModal';

interface ImageThumbnailProps {
  src: string;
  onClick: () => void;
  isExpanded?: boolean;
  isAssistantMessage?: boolean;
}

export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  src,
  onClick,
  isExpanded,
  isAssistantMessage,
}) => {
  const { jwt, walletAddress } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const downloadImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Extract filename from URL for display purposes
      let displayFilename;
      try {
        const urlObj = new URL(src);
        const segments = urlObj.pathname.split('/');
        displayFilename = segments[segments.length - 1] || 'image.png';
      } catch (err) {
        console.error('Error extracting filename', err);
        displayFilename = 'image.png';
      }

      // Fetch the image as a blob first
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Convert to blob
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);
      
      // Create an invisible anchor element with download attribute
      const a = document.createElement('a');
      
      // Set the href to the blob URL instead of the direct image source
      a.href = blobUrl;
      
      // Set the download attribute with the filename
      a.download = displayFilename;
      
      // Make the anchor invisible
      a.style.display = 'none';
      
      // Add to the document
      document.body.appendChild(a);
      
      // Trigger the click
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        // Revoke the blob URL to free up memory
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      console.log('Download initiated for:', displayFilename);
    } catch (error) {
      console.error('Error during download:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div className="cursor-pointer relative" onClick={onClick}>
        <img
          src={src}
          alt="Generated or Uploaded"
          className={`rounded ${
            isAssistantMessage
              ? isExpanded
                ? 'max-w-full w-full h-auto max-h-[80vh] object-contain'
                : 'max-w-[100px] max-h-[100px] object-cover'
              : 'max-w-[100px] max-h-[100px] object-cover'
          } transition-all duration-200`}
        />
        {isAssistantMessage && isExpanded && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <div
              className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors rounded shadow-md"
              onClick={handleEdit}
            >
              <Pencil className="h-5 w-5 text-white" />
            </div>
            <div
              className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors rounded shadow-md"
              onClick={downloadImage}
            >
              <Download className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>
      <ImageEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        imageUrl={src}
      />
    </>
  );
}; 