import React, { useRef, useEffect } from 'react';
import { ScrollArea } from './scrollarea';
import { MessageBubble } from './MessageBubble';
import { Message } from '../../../app/chat/page';

interface ChatWindowProps {
  messages: Message[];
  onCopy: (text: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onCopy }) => {
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
    <ScrollArea
      className="flex-1 p-4 w-full max-w-6xl"
      style={{ height: 'calc(100vh - 200px)' }}
      ref={scrollAreaRef}
    >
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={message.id} ref={index === messages.length - 1 ? lastMessageRef : null}>
            <MessageBubble message={message} onCopy={onCopy} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
