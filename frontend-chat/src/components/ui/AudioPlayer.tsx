import React from 'react';
import { Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

const AudioPlayerComponent: React.FC<AudioPlayerProps> = ({ src }) => {
  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-gray-100 rounded-lg w-full max-w-full sm:max-w-[90%] md:max-w-[80%]">
      <Volume2 className="h-4 w-4 flex-shrink-0" />
      <audio controls className="w-full min-w-0" key={src}>
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export const AudioPlayer = React.memo(AudioPlayerComponent); 