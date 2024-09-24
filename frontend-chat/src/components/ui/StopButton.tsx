import { Button } from './button';
import { StopCircle } from 'lucide-react'; // Assuming you have a stop icon

interface StopButtonProps {
  onStop: () => void; // Function to handle stopping the assistant
}

export function StopButton({ onStop }: StopButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onStop}
      className="text-gray-500 hover:bg-gray-300 hover:text-gray-800" // Changed to grey colors
    >
      <StopCircle className="h-4 w-4" />
    </Button>
  );
}
