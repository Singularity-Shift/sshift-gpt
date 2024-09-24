import { Button } from './button';
import { StopCircle } from 'lucide-react'; // Assuming you have a stop icon

interface StopButtonProps {
  onStop: () => void; // Function to handle stopping the assistant
}

export function StopButton({ onStop }: StopButtonProps) {
  return (
    <Button
      variant="outline" // Changed to outline variant
      size="icon"
      onClick={onStop}
      className="text-black hover:bg-gray-300" // Black text by default, light grey on hover
    >
      <StopCircle className="h-4 w-4 text-black hover:text-gray-500" /> {/* Black icon by default, grey on hover */}
    </Button>
  );
}
