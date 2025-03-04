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
  onToggleMiniApps?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedModel,
  onModelChange,
  onNewChat,
  onNavigateToDashboard,
  currentChatModel,
  onToggleMiniApps,
}) => {
  return (
    <div className="flex items-center justify-between p-2 min-[1010px]:p-4 border-b border-border h-[73px] w-full">
      <div className="flex items-center gap-2 min-[1010px]:gap-4 md:pl-0 pl-10 max-[1134px]:min-[768px]:pl-14 pr-4">
        <Button
          onClick={onNavigateToDashboard}
          variant="ghost"
          size="sm"
          className="min-[1010px]:hidden flex items-center gap-1.5 text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium min-[500px]:inline hidden">Dash</span>
        </Button>
        <Button
          onClick={onNavigateToDashboard}
          variant="ghost"
          size="sm"
          className="hidden min-[1010px]:flex items-center space-x-2 text-gray-800 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>
        
        {/* Model selector - simplified on small screens */}
        <div className="min-w-0 flex-shrink">
          <Select value={currentChatModel || selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-[130px] max-[450px]:w-[110px] min-[1010px]:w-[180px] bg-white shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)] border-gray-100 hover:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all">
              <SelectValue placeholder="Select model" className="max-[450px]:truncate" />
            </SelectTrigger>
            <SelectContent className="bg-white shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)] border-gray-100">
              <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="o3-mini">O3-mini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* New Chat button - compact on small screens */}
        <Button 
          onClick={onNewChat} 
          variant="outline"
          className="h-9 whitespace-nowrap bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)] transition-colors max-[425px]:w-9 max-[425px]:p-0 min-[426px]:px-4"
        >
          <span className="hidden min-[426px]:inline text-blue-600">New Chat</span>
          <Plus className="min-[426px]:hidden h-4 w-4 text-blue-600" />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        {onToggleMiniApps && (
          <Button
            onClick={onToggleMiniApps}
            variant="outline"
            size="sm"
            className="flex items-center justify-center h-9 w-9 rounded-full bg-white shadow-sm border-gray-200 hover:bg-gray-50"
            aria-label="Mini Apps"
            title="Mini Apps"
          >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-green-500 rounded-sm"></div>
              <div className="bg-green-600 rounded-sm"></div>
              <div className="bg-green-600 rounded-sm"></div>
              <div className="bg-green-500 rounded-sm"></div>
            </div>
          </Button>
        )}
        <UserLoginStatus />
      </div>
    </div>
  );
};
