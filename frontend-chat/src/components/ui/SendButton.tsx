import React from 'react';
import { Button } from './button';
import { Send } from 'lucide-react';

interface SendButtonProps {
  onClick: () => void;
}

export const SendButton: React.FC<SendButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="outline" // Ensure this matches the other buttons
      size="icon" // Add size prop to match
      className="shrink-0 hover:bg-gray-200" // Ensure consistent hover effect
      onClick={onClick}
    >
      <Send className="h-4 w-4" />
    </Button>
  );
};
