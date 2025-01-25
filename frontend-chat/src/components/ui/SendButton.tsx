import React from 'react';
import { Button } from './button';
import { Send } from 'lucide-react';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const SendButton: React.FC<SendButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={`shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
    </Button>
  );
};
