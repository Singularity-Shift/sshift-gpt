import React from 'react';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { ArrowLeft, Plus } from 'lucide-react';
import UserLoginStatus from './UserLoginStatus';

interface ChatHeaderProps {
  selectedModel: string;
  onModelChange: (value: string) => void;
  onNewChat: () => void;
  onNavigateToDashboard: () => void;
  currentChatModel: string | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedModel,
  onModelChange,
  onNewChat,
  onNavigateToDashboard,
  currentChatModel,
}) => {
  return (
    <div className="flex items-center justify-between p-2 md:p-4 border-b border-border h-[60px] md:h-[73px] w-full">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          onClick={onNavigateToDashboard}
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          title="Back to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={onNavigateToDashboard}
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center space-x-2 text-gray-800 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>
        <Select value={currentChatModel || selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[130px] md:w-[180px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={onNewChat} 
          variant="outline"
          size="icon-sm"
          className="md:hidden"
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          onClick={onNewChat} 
          variant="outline"
          size="sm"
          className="hidden md:inline-flex"
        >
          New Chat
        </Button>
      </div>
      <UserLoginStatus />
    </div>
  );
};
