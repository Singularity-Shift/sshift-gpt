import React, { useRef, useEffect } from 'react';
import { ScrollArea } from './scrollarea';
import { MessageBubble } from './MessageBubble';
import { StatusIndicator } from './statusIndicator';
import { Message } from '../../../app/chat/page';

interface ChatWindowProps {
  messages: Message[];
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void;
  onEdit: (message: Message, newContent: string) => void;
  isWaiting: boolean;
  isTyping: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onCopy, 
  onRegenerate, 
  onEdit,
  isWaiting,
  isTyping
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
  }, [messages, isWaiting, isTyping]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full max-w-7xl mx-auto">
      <ScrollArea className="flex-1">
        <div className="w-full px-4 py-8 space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              ref={index === messages.length - 1 && !isWaiting && !isTyping ? lastMessageRef : null}
            >
              <MessageBubble 
                message={message} 
                onCopy={onCopy} 
                onRegenerate={() => onRegenerate(message)}
                onEdit={(editedMessage, newContent) => onEdit(editedMessage, newContent)}
              />
            </div>
          ))}
          {(isWaiting || isTyping) && (
            <div ref={lastMessageRef}>
              <StatusIndicator status={isTyping ? "typing" : "thinking"} className="ml-2" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};