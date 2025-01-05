import React from 'react';
import { Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
      <Volume2 className="h-4 w-4" />
      <audio controls className="w-full max-w-md">
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}; 