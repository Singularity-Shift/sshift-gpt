import React, { useRef, useEffect } from 'react';
import { ScrollArea } from './scrollarea';
import { MessageBubble } from './MessageBubble';
import { StatusIndicator } from './statusIndicator';
import { Message } from '../../../app/chat/page';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

interface ChatWindowProps {
  messages: Message[];
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void;
  onEdit: (message: Message, newContent: string) => void;
  status: 'thinking' | 'tool-calling' | 'typing';
  showNoChatsMessage: boolean;
  isAssistantResponding: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onCopy, 
  onRegenerate, 
  onEdit,
  status,
  showNoChatsMessage,
  isAssistantResponding
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status, isAssistantResponding]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full max-w-7xl mx-auto relative min-h-0">
      <ScrollArea className="flex-1 min-h-0">
        <div className="w-full px-2 py-2 md:px-4 md:py-8 space-y-3 md:space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              ref={index === messages.length - 1 ? lastMessageRef : null}
            >
              <MessageBubble 
                message={message} 
                onCopy={onCopy} 
                onRegenerate={() => onRegenerate(message)}
                onEdit={(editedMessage, newContent) => onEdit(editedMessage, newContent)}
              />
            </div>
          ))}
          {isAssistantResponding && (
            <div className="flex items-start space-x-2" ref={lastMessageRef}>
              {status === 'thinking' && (!messages?.length || messages[messages.length - 1]?.role === 'user') && (
                <Avatar className="w-6 h-6 md:w-8 md:h-8 mr-2 flex-shrink-0">
                  <AvatarImage src="/images/sshift-guy.png" alt="AI Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <StatusIndicator status={status} className={status === 'thinking' && (!messages?.length || messages[messages.length - 1]?.role === 'user') ? "mt-1 md:mt-2" : ""} />
            </div>
          )}
        </div>
      </ScrollArea>
      {showNoChatsMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50">
          <div className="bg-background border border-border rounded-md p-4 shadow-lg">
            <h3 className="font-semibold mb-2">No active chat</h3>
            <p>Please start a NEW CHAT to send a message</p>
          </div>
        </div>
      )}
    </div>
  );
};
