'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../../src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../src/components/ui/select';
import { Textarea } from '../../src/components/ui/textarea';
import { ScrollArea } from '../../src/components/ui/scrollarea';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../src/components/ui/avatar';
import {
  Paperclip,
  Image,
  Send,
  LogOut,
  Volume2,
  Copy,
  RefreshCw,
  Trash2,
  Pencil,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Input } from '../../src/components/ui/input';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { SshiftWalletDisconnect } from '@fn-chat/components/SshigtWallet';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
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
}

export default function ChatPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [inputMessage, setInputMessage] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<number | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: chats.length + 1,
      title: `New Chat ${chats.length + 1}`,
      messages: [],
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleChatSelect = (chatId: number) => {
    setCurrentChatId(chatId);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() && currentChatId) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
      };

      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            const updatedMessages = [...chat.messages, userMessage];
            // Update the chat title if this is the first message
            const updatedTitle =
              updatedMessages.length === 1
                ? inputMessage.split(' ').slice(0, 5).join(' ') + '...'
                : chat.title;
            return { ...chat, messages: updatedMessages, title: updatedTitle };
          }
          return chat;
        });
        return updatedChats;
      });

      setInputMessage('');
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
              userMessage,
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const CodeBlock = ({
    language,
    value,
  }: {
    language: string;
    value: string;
  }) => {
    return (
      <div className="relative">
        <SyntaxHighlighter
          style={materialDark}
          language={language}
          PreTag="div"
        >
          {value}
        </SyntaxHighlighter>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 hover:bg-gray-200"
          onClick={() => handleCopy(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    );
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

  const handleRenameClick = (chatId: number) => {
    setRenamingChatId(chatId);
    const chat = chats.find((c) => c.id === chatId);
    setNewChatTitle(chat ? chat.title : '');
  };

  const handleRenameSubmit = (chatId: number) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, title: newChatTitle } : chat
      )
    );
    setRenamingChatId(null);
  };

  const handleNavigateToDashboard = () => {
    router.push('/dashboard');
  };

  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id);
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

  useEffect(() => {
    console.log('Chats state updated:', chats);
  }, [chats]);

  console.log('Current chats state:', chats);
  console.log('Current chat ID:', currentChatId);

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  console.log('Current chat:', currentChat);
  console.log('Current chat messages:', currentChat?.messages);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault(); // Prevent default to avoid any unwanted behavior
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ChatSidebar */}
      <div className="w-80 border-r border-border bg-background hidden md:block">
        <div className="p-4 border-b border-border h-[73px] flex items-center">
          <h2 className="text-lg font-semibold">Chat History</h2>
        </div>
        <ScrollArea className="h-[calc(100%-73px)]">
          <div className="p-4 space-y-2">
            {chats.map((chat) => (
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
                      className="w-full pr-16"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="absolute right-8 top-1/2 -translate-y-1/2"
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
                      className="w-full justify-start text-left truncate pr-16"
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      {chat.title}
                    </Button>
                    <div className="flex absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameClick(chat.id);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 items-center">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border h-[73px] w-full">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleNavigateToDashboard}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-gray-800 font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleNewChat} variant="outline">
              New Chat
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              <span className="text-gray-800 font-semibold">Connected</span>
            </div>
            <SshiftWalletDisconnect />
          </div>
        </div>

        {/* ChatWindow */}
        <ScrollArea
          className="flex-1 p-4 w-full max-w-6xl"
          style={{ height: 'calc(100vh - 200px)' }}
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
            {currentChat?.messages.map((message, index) => {
              console.log('Rendering message:', message);
              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  } relative`}
                  ref={
                    index === currentChat.messages.length - 1
                      ? lastMessageRef
                      : null
                  }
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
                      <AvatarImage
                        src="/images/sshift-guy.png"
                        alt="AI Avatar"
                      />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-100 text-black'
                        : 'bg-gray-100'
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        code: ({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <CodeBlock
                              language={match[1]}
                              value={String(children).replace(/\n$/, '')}
                            />
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold mb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-bold mb-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-bold mb-2">{children}</h3>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-4 mb-2">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-4 mb-2">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-1">{children}</li>
                        ),
                      }}
                      className="prose max-w-none"
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.role === 'assistant' && (
                      <div className="flex space-x-2 mt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-200"
                          onClick={() => handleCopy(message.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-200"
                        >
                          <Volume2 className="h-4 w-4" />{' '}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-200"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {message.model && (
                      <div className="text-xs text-gray-500 mt-2">
                        Model: {message.model}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* ChatInput */}
        <div className="border-t border-border p-4 w-full">
          <div className="flex items-end space-x-2 max-w-6xl mx-auto">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 hover:bg-gray-200"
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              className="shrink-0 hover:bg-gray-200"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
