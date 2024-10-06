import React, { useState } from 'react';
import { Button } from './button';
import { ScrollArea } from './scrollarea';
import { Input } from './input';
import { Pencil, Trash2, Trash } from 'lucide-react';

interface Chat {
  id: string; // Change this to string
  title: string;
  messages: any[]; // You might want to define a more specific type for messages
  lastUpdated: number;
}

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null; // Change this to string | null
  onChatSelect: (chatId: string) => void; // Change this to accept string
  onDeleteChat: (chatId: string) => void; // Change this to accept string
  onRenameChat: (chatId: string, newTitle: string) => void; // Change this to accept string
  onClearAllChats: () => void; // Add this new prop
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  currentChatId,
  onChatSelect,
  onDeleteChat,
  onRenameChat,
  onClearAllChats, // Add this new prop
}) => {
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null); // Change this to string | null
  const [newChatTitle, setNewChatTitle] = useState('');

  const handleRenameClick = (chatId: string) => {
    setRenamingChatId(chatId);
    const chat = chats.find((c) => c.id === chatId);
    setNewChatTitle(chat?.title || '');
  };

  const handleRenameSubmit = (chatId: string) => {
    onRenameChat(chatId, newChatTitle);
    setRenamingChatId(null);
  };

  const handleClearAllChats = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      onClearAllChats();
    }
  };

  const groupChats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const previous7Days = new Date(today);
    previous7Days.setDate(previous7Days.getDate() - 7);
    const previous30Days = new Date(today);
    previous30Days.setDate(previous30Days.getDate() - 30);
    const previous90Days = new Date(today);
    previous90Days.setDate(previous90Days.getDate() - 90);

    const chatGroups: { [key: string]: Chat[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Previous 90 Days': [],
      Older: [],
    };

    chats.forEach((chat) => {
      const lastUpdated = new Date(chat.lastUpdated);
      lastUpdated.setHours(0, 0, 0, 0);
      if (lastUpdated.getTime() === today.getTime()) {
        chatGroups.Today.push(chat);
      } else if (lastUpdated.getTime() === yesterday.getTime()) {
        chatGroups.Yesterday.push(chat);
      } else if (lastUpdated >= previous7Days) {
        chatGroups['Previous 7 Days'].push(chat);
      } else if (lastUpdated >= previous30Days) {
        chatGroups['Previous 30 Days'].push(chat);
      } else if (lastUpdated >= previous90Days) {
        chatGroups['Previous 90 Days'].push(chat);
      } else {
        chatGroups.Older.push(chat);
      }
    });

    return chatGroups;
  };

  const chatGroups = groupChats();

  return (
    <div className="w-80 border-r border-border bg-background hidden md:block">
      <div className="p-4 border-b border-border h-[73px] flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearAllChats}
          className="flex items-center"
          disabled={chats.length === 0}
        >
          <Trash className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>
      <ScrollArea className="h-[calc(100%-73px)]">
        <div className="p-4 space-y-2">
          {Object.entries(chatGroups).map(
            ([group, groupChats]) =>
              groupChats.length > 0 && (
                <div key={group}>
                  <h3 className="text-sm font-semibold mb-2 text-gray-600">
                    {group}
                  </h3>
                  {groupChats.map((chat) => (
                    <div key={chat.id} className="relative group mb-1">
                      {renamingChatId === chat.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleRenameSubmit(chat.id);
                          }}
                          className="flex"
                        >
                          <Input
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                            className="w-full pr-16 text-sm"
                            autoFocus
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="absolute right-8 top-1/2 -translate-y-1/2 text-sm"
                          >
                            Save
                          </Button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <Button
                            variant={
                              currentChatId === chat.id ? 'secondary' : 'ghost'
                            }
                            className="w-full justify-start text-left truncate pr-16 text-sm"
                            onClick={() => onChatSelect(chat.id)}
                          >
                            {chat.title}
                          </Button>
                          <div className="flex absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 mr-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameClick(chat.id);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
