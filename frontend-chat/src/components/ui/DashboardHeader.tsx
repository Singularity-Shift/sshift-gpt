import React from 'react';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import UserLoginStatus from './UserLoginStatus';
import { useAppManagment } from '../../context/AppManagment';
import { useRouter } from 'next/navigation';

const DashboardHeader = () => {
  const { isAdmin, isPendingAdmin } = useAppManagment();
  const router = useRouter(); // Import the useRouter hook from Next.js
  return (
    <div className="bg-white bg-opacity-90 shadow-sm py-2 px-4 flex justify-between items-center h-[73px] relative z-10">
      <div className="flex items-center space-x-4">
        <Button
          onClick={() => router.push('/chat')}
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Chat</span>
        </Button>

        {(isAdmin || isPendingAdmin) &&
          typeof location === 'object' &&
          location.pathname !== '/admin' && (
            <Button
              onClick={() => router.push('/admin')}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Admin</span>
            </Button>
          )}

        {typeof location === 'object' && location.pathname !== '/dashboard' && (
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
        )}
      </div>
      <UserLoginStatus />
    </div>
  );
};

export default DashboardHeader;
