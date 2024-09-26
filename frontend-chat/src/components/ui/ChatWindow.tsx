import React, { useRef, useEffect } from 'react';
import { ScrollArea } from './scrollarea';
import { MessageBubble } from './MessageBubble';
import { Message } from '../../../app/chat/page';

interface ChatWindowProps {
  messages: Message[];
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void; // 1. Add onRegenerate to props
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onCopy, onRegenerate }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full max-w-7xl mx-auto"> {/* Adjusted max width */}
      <ScrollArea className="flex-1">
        <div className="w-full px-4 py-8 space-y-4">
          {messages.map((message, index) => (
            <div key={message.id} ref={index === messages.length - 1 ? lastMessageRef : null}>
              <MessageBubble 
                message={message} 
                onCopy={onCopy} 
                onRegenerate={() => onRegenerate(message)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
