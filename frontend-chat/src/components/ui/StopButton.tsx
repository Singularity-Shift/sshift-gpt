import { Button } from './button';
import { StopCircle } from 'lucide-react';

interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  const handleStopClick = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
      });
      if (response.ok) {
        onStop();
      } else {
        console.error('Failed to stop the stream:', response.statusText);
      }
    } catch (error) {
      console.error('Error stopping the stream:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={handleStopClick}
      className="text-black hover:bg-gray-200"
    >
      <StopCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-black hover:text-gray-500" />
    </Button>
  );
}
