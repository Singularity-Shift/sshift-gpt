'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatSidebar } from '../../src/components/ui/ChatSidebar';
import { ChatHeader } from '../../src/components/ui/ChatHeader';
import { ChatWindow } from '../../src/components/ui/ChatWindow';
import { ChatInput } from '../../src/components/ui/ChatInput';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
  created?: number;
  model?: string;
  finish_reason?: string;
  system_fingerprint?: string;
}

interface Chat {
  id: number;
  title: string;
  messages: Message[];
  isRenaming?: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  createdAt: number;
  lastUpdated: number;
}

export default function ChatPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewChat = () => {
    const currentTime = Date.now();
    const newChat: Chat = {
      id: chats.length + 1,
      title: `New Chat ${chats.length + 1}`,
      messages: [],
      createdAt: currentTime,
      lastUpdated: currentTime,
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleChatSelect = (chatId: number) => {
    setCurrentChatId(chatId);
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? { ...chat, lastUpdated: Date.now() }
          : chat
      )
    );
  };

  const handleSendMessage = async (inputMessage: string, selectedImage: string | null) => {
    if (inputMessage.trim() || selectedImage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
        image: selectedImage || undefined,
      };

      const formattedMessage = {
        role: 'user',
        content: [
          ...(selectedImage ? [{ type: 'image_url', image_url: { url: selectedImage, detail: 'high' } }] : []),
          { type: 'text', text: inputMessage }
        ]
      };

      setChats((prevChats) => {
        const currentTime = Date.now();
        return prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            const updatedMessages = [...chat.messages, userMessage];
            const updatedTitle =
              updatedMessages.length === 1
                ? inputMessage.split(' ').slice(0, 5).join(' ') + '...'
                : chat.title;
            return {
              ...chat,
              messages: updatedMessages,
              title: updatedTitle,
              lastUpdated: currentTime,
            };
          }
          return chat;
        });
      });

      scrollToBottom();

      try {
        console.log('Sending message to API...');
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              ...(chats.find((chat) => chat.id === currentChatId)?.messages ||
                []),
              formattedMessage,
            ],
            model: selectedModel,
          }),
        });
        console.log('API response received:', response);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '',
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream complete');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log('Received chunk:', chunk);
          const lines = chunk.split('\n').filter((line) => line.trim() !== '');

          for (const line of lines) {
            if (line === 'data: [DONE]') {
              console.log('Received DONE signal');
              // Add the final assistant message to the chat
              setChats((prevChats) =>
                prevChats.map((chat) =>
                  chat.id === currentChatId
                    ? {
                        ...chat,
                        messages: chat.messages.some(
                          (m) => m.id === assistantMessage.id
                        )
                          ? chat.messages.map((m) =>
                              m.id === assistantMessage.id
                                ? assistantMessage
                                : m
                            )
                          : [...chat.messages, assistantMessage],
                      }
                    : chat
                )
              );
              return;
            }
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));
              console.log('Parsed data:', data);
              if (data.content) {
                assistantMessage.content += data.content;
                // Update the chat with the current state of the assistant message
                setChats((prevChats) =>
                  prevChats.map((chat) =>
                    chat.id === currentChatId
                      ? {
                          ...chat,
                          messages: chat.messages.some(
                            (m) => m.id === assistantMessage.id
                          )
                            ? chat.messages.map((m) =>
                                m.id === assistantMessage.id
                                  ? assistantMessage
                                  : m
                              )
                            : [...chat.messages, assistantMessage],
                        }
                      : chat
                  )
                );
                scrollToBottom();
              }
            }
          }
        }

        console.log('Final assistant message:', assistantMessage);
      } catch (error) {
        console.error('Error in handleSendMessage:', error);
      }
    }
  };

  const handleDeleteChat = (chatId: number) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        setCurrentChatId(null);
        handleNewChat(); // Create a new chat if all chats are deleted
      }
    }
  };

  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      const updatedChats = parsedChats.map((chat: Chat) => ({
        ...chat,
        createdAt: chat.createdAt || Date.now(),
        lastUpdated: chat.lastUpdated || Date.now(),
      }));
      setChats(updatedChats);
      if (updatedChats.length > 0) {
        setCurrentChatId(updatedChats[0].id);
      } else {
        handleNewChat();
      }
    } else {
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onDeleteChat={handleDeleteChat}
        onRenameChat={(chatId, newTitle) => {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === chatId ? { ...chat, title: newTitle } : chat
            )
          );
        }}
      />

      <div className="flex flex-col flex-1">
        <ChatHeader
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onNewChat={handleNewChat}
          onNavigateToDashboard={() => router.push('/dashboard')}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatWindow
            messages={currentChat?.messages || []}
            onCopy={(text: string) => navigator.clipboard.writeText(text)}
          />
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}