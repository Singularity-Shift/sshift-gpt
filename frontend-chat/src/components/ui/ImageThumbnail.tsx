import React from 'react';
import { Download } from 'lucide-react';

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
  isAssistantMessage
}) => {
  return (
    <div className="cursor-pointer relative" onClick={onClick}>
      <img
        src={src}
        alt="Generated or Uploaded"
        className={`rounded ${
          isAssistantMessage 
            ? isExpanded 
              ? "max-w-full w-full h-auto" 
              : "max-w-[100px] max-h-[100px]"
            : "max-w-[100px] max-h-[100px]"
        } object-cover transition-all duration-200`}
      />
      {isAssistantMessage && isExpanded && (
        <div 
          className="absolute bottom-2 right-2 p-1.5 hover:bg-white/10 transition-colors rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-5 w-5 text-white" />
        </div>
      )}
    </div>
  );
}; 