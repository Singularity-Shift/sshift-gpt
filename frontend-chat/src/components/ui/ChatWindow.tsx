import React, { useRef, useEffect, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { StatusIndicator } from './statusIndicator';
import { Message } from '../../../app/chat/page';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import InfiniteScroll from 'react-infinite-scroller';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void;
  onEdit: (message: Message, newContent: string) => void;
  status: 'thinking' | 'tool-calling' | 'typing';
  showNoChatsMessage: boolean;
  isAssistantResponding: boolean;
  currentChatId?: string;
  onLoadMore: (page: number) => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onCopy, 
  onRegenerate, 
  onEdit,
  status,
  showNoChatsMessage,
  isAssistantResponding,
  currentChatId,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [shouldEnableInfiniteScroll, setShouldEnableInfiniteScroll] = useState(false);
  const [initialScrollHeight, setInitialScrollHeight] = useState<number | null>(null);
  const previousScrollHeightRef = useRef<number>(0);
  const isLoadingOlderMessages = useRef(false);

  // Initial scroll position setup
  useEffect(() => {
    if (scrollContainerRef.current && initialLoad && messages.length > 0) {
      const container = scrollContainerRef.current;
      const scrollHeight = container.scrollHeight;
      setInitialScrollHeight(scrollHeight);
      container.scrollTop = scrollHeight;
      setInitialLoad(false);
      
      // Enable infinite scroll after ensuring scroll position is maintained
      const enableScrollTimer = setTimeout(() => {
        setShouldEnableInfiniteScroll(true);
      }, 1000);

      return () => clearTimeout(enableScrollTimer);
    }
  }, [messages, initialLoad]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || initialLoad) return;

    if (isLoadingOlderMessages.current && messages.length > 0) {
      // Calculate how much new content was added
      const newScrollHeight = container.scrollHeight;
      const addedHeight = newScrollHeight - previousScrollHeightRef.current;
      
      // Adjust scroll position to maintain the same relative position
      if (addedHeight > 0) {
        container.scrollTop = container.scrollTop + addedHeight;
      }
      
      isLoadingOlderMessages.current = false;
    }
    
    // Store current scroll height for next comparison
    previousScrollHeightRef.current = container.scrollHeight;
  }, [messages, initialLoad]);

  // Only scroll to bottom for new messages
  const prevMessageCountRef = useRef(messages.length);
  const prevMessagesRef = useRef(messages);
  useEffect(() => {
    const isNewMessage = messages.length > prevMessageCountRef.current;
    // Check if the new messages were added at the end (new messages) or beginning (history)
    const wasAppended = isNewMessage && 
      messages.slice(-1)[0]?.id !== prevMessagesRef.current.slice(-1)[0]?.id;

    if (!initialLoad && wasAppended && !isLoadingOlderMessages.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
    prevMessagesRef.current = messages;
  }, [messages, initialLoad]);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Debug logs for props
  useEffect(() => {
    console.log('ChatWindow props:', {
      messagesCount: messages.length,
      hasMore,
      isLoadingMore,
      currentChatId,
      shouldEnableInfiniteScroll
    });
  }, [messages.length, hasMore, isLoadingMore, currentChatId, shouldEnableInfiniteScroll]);

  const handleLoadMore = async (page: number) => {
    if (!isLoadingMore && hasMore) {
      // Set flag before loading older messages
      isLoadingOlderMessages.current = true;
      // Store current scroll height before loading
      if (scrollContainerRef.current) {
        previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      }
      await onLoadMore(page);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full max-w-7xl mx-auto relative min-h-0">
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ 
          height: 'calc(100vh - 180px)',
          scrollbarWidth: 'none',  /* Firefox */
          msOverflowStyle: 'none',  /* IE and Edge */
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx global>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          
          /* Hide scrollbar for IE, Edge and Firefox */
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}</style>
        <InfiniteScroll
          pageStart={1}
          loadMore={handleLoadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center items-center py-4" key={0}>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          }
          useWindow={false}
          getScrollParent={() => scrollContainerRef.current}
          isReverse={true}
          threshold={100}
          initialLoad={false}
        >
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
        </InfiniteScroll>
      </div>
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
