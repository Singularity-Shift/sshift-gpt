'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid'; // Add this import
import { ChatSidebar } from '../../src/components/ui/ChatSidebar';
import { ChatHeader } from '../../src/components/ui/ChatHeader';
import { ChatWindow } from '../../src/components/ui/ChatWindow';
import { ChatInput } from '../../src/components/ui/ChatInput';
import backend from '../../src/services/backend';

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
  id: string; // Change this to string
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
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewChat = () => {
    const currentTime = Date.now();
    const newChat: Chat = {
      id: uuidv4(), // Use UUID for the id
      title: `New Chat ${chats.length + 1}`,
      messages: [],
      createdAt: currentTime,
      lastUpdated: currentTime,
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, lastUpdated: Date.now() } : chat
      )
    );
  };

  const handleSendMessage = async (
    inputMessage: string,
    selectedImage: string | null
  ) => {
    setIsWaiting(true);
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
          ...(selectedImage
            ? [
                {
                  type: 'image_url',
                  image_url: { url: selectedImage, detail: 'high' },
                },
              ]
            : []),
          { type: 'text', text: inputMessage },
        ],
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
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') {
                setIsTyping(false);
                break;
              }
              try {
                const parsedData = JSON.parse(data);
                if (parsedData.content) {
                  assistantMessage.content += parsedData.content;
                  updateChat(assistantMessage);
                } else if (parsedData.tool_response) {
                  if (parsedData.tool_response.name === 'generateImage') {
                    assistantMessage.image = parsedData.tool_response.result.image_url;
                    updateChat(assistantMessage);
                  }
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }

        console.log('Final assistant message:', assistantMessage);
        setIsWaiting(false);
        setIsTyping(false);
      } catch (error) {
        console.error('Error in handleSendMessage:', error);
        setIsWaiting(false);
        setIsTyping(false);
      }
    }
  };

  const updateChat = (message: Message) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: chat.messages.some((m) => m.id === message.id)
                ? chat.messages.map((m) =>
                    m.id === message.id ? message : m
                  )
                : [...chat.messages, message],
            }
          : chat
      )
    );
    scrollToBottom();
  };

  const handleDeleteChat = (chatId: string) => {
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

  const handleRegenerateMessage = async (assistantMessage: Message) => {
    if (!currentChatId) return;

    try {
      console.log('Regenerating message...');
      setIsWaiting(true);
      setIsTyping(false);
      const currentChat = chats.find(chat => chat.id === currentChatId);
      if (!currentChat) return;

      // Find the index of the assistant message to regenerate
      const messageIndex = currentChat.messages.findIndex(msg => msg.id === assistantMessage.id);
      if (messageIndex === -1) return;

      // Get all messages up to and including the previous user message
      const messagesUpToLastUser = currentChat.messages.slice(0, messageIndex);

      // Call regenerateConversation with these messages
      await regenerateConversation(messagesUpToLastUser);
    } catch (error) {
      console.error('Error in handleRegenerateMessage:', error);
    } finally {
      setIsWaiting(false);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    (async () => {
      const chatResponse = await backend.get('/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      const savedChats = chatResponse.data;
      if (savedChats) {
        const updatedChats = savedChats.chats.map((chat: Chat) => ({
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
    })();
  }, []);

  useEffect(() => {
    if (!chats?.length) return;

    const syncChats = async () => {
      try {
        await backend.put('/history', [...chats], {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        });
      } catch (error) {
        console.error('Error syncing chats with database:', error);
      }
    };

    // Debounce the sync operation
    const timeoutId = setTimeout(syncChats, 1000);

    return () => clearTimeout(timeoutId);
  }, [chats]);

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  const handleEdit = (editedMessage: Message, newContent: string) => {
    const editedMessageIndex = currentChat?.messages.findIndex(
      (msg) => msg.id === editedMessage.id
    );
    if (
      editedMessageIndex !== undefined &&
      editedMessageIndex !== -1 &&
      currentChat
    ) {
      const updatedMessages = currentChat.messages.slice(
        0,
        editedMessageIndex + 1
      );
      updatedMessages[editedMessageIndex] = {
        ...editedMessage,
        content: newContent,
      };
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: updatedMessages }
            : chat
        )
      );
      // Regenerate the conversation from this point forward
      setIsWaiting(true);
      setIsTyping(false);
      regenerateConversation(updatedMessages)
        .finally(() => {
          setIsWaiting(false);
          setIsTyping(false);
        });
    }
  };

  const regenerateConversation = async (messagesUpToEdit: Message[]) => {
    if (!currentChatId) return;

    try {
      console.log('Regenerating conversation...');
      setIsWaiting(true);
      setIsTyping(false);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesUpToEdit.map(msg => {
            if (msg.role === 'user' && msg.image) {
              return {
                role: msg.role,
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: msg.image, detail: 'high' },
                  },
                  { type: 'text', text: msg.content },
                ],
              };
            } else {
              return {
                role: msg.role,
                content: msg.content,
              };
            }
          }),
          model: selectedModel,
        }),
      });
      console.log('API response received for regeneration:', response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;

      const newAssistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
      };

      while (!done) {
        const { value, done: doneReading } = await reader?.read()!;
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });

        // Set isTyping to true when we start receiving the response
        if (!isTyping) {
          setIsTyping(true);
          setIsWaiting(false);
        }

        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));
            console.log('Parsed data for regeneration:', data);
            if (data.content) {
              newAssistantMessage.content += data.content;
              setChats((prevChats) =>
                prevChats.map((c) =>
                  c.id === currentChatId
                    ? {
                        ...c,
                        messages: [...messagesUpToEdit, newAssistantMessage],
                      }
                    : c
                )
              );
              scrollToBottom();
            }
          }
        }
      }

      console.log('Final regenerated assistant message:', newAssistantMessage);
    } catch (error) {
      console.error('Error in regenerateConversation:', error);
    } finally {
      setIsWaiting(false);
      setIsTyping(false);
    }
  };

  const handleClearAllChats = async () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      setChats([]); // Clear all chats from state
      setCurrentChatId(null); // Reset current chat ID

      try {
        // Clear chats from the database
        await backend.put('/history', [], {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        });
        console.log('All chats cleared from database');
      } catch (error) {
        console.error('Error clearing chats from database:', error);
        // Optionally, you could show an error message to the user here
      }
    }
  };

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
        onClearAllChats={handleClearAllChats}
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
            onRegenerate={handleRegenerateMessage}
            onEdit={handleEdit}
            isWaiting={isWaiting}
            isTyping={isTyping}
          />
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}