import React from 'react';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserLoginStatus from './UserLoginStatus';

interface DashboardHeaderProps {
  onNavigateToChat: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onNavigateToChat }) => {
  return (
    <div className="bg-white bg-opacity-90 shadow-sm py-2 px-4 flex justify-between items-center h-[73px] relative z-10">
      <div className="flex items-center space-x-4">
        <Button
          onClick={onNavigateToChat}
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Chat</span>
        </Button>
      </div>
      <UserLoginStatus />
    </div>
  );
};

export default DashboardHeader;
