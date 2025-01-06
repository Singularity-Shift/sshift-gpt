import React from 'react';

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
    <div className="cursor-pointer" onClick={onClick}>
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
    </div>
  );
}; 