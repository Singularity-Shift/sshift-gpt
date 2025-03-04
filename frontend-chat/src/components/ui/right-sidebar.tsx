import React from 'react';
import { Button } from './button';
import { ScrollArea } from './scrollarea';
import { X } from 'lucide-react';

interface RightSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen = false,
  onClose,
}) => {
  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" 
          onClick={onClose}
        />
      )}
      <div className={`
        fixed top-0 right-0 h-[100dvh] w-80 border-l border-border
        bg-white
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border h-[73px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-blue-500 rounded-sm"></div>
                <div className="bg-blue-500 rounded-sm"></div>
                <div className="bg-blue-500 rounded-sm"></div>
                <div className="bg-blue-500 rounded-sm"></div>
              </div>
              <h2 className="text-lg font-semibold">Mini-Apps</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100"
                aria-label="Close Mini Apps"
                title="Close Mini Apps"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Content will go here in the future */}
              <p className="text-gray-500 text-center mt-4">No mini-apps available yet</p>
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}; 