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
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Input } from '../../src/components/ui/input';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { SshiftWalletDisconnect } from '@fn-chat/components/SshigtWallet';
import imageCompression from 'browser-image-compression'; // Import image compression library

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; // Added field for image
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
  createdAt: number; // Timestamp for when the chat was created
  lastUpdated: number; // New field for last update timestamp
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

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null); // Add this line to define uploadedFile state

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Button Click
  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle Image Selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload PNG, JPEG, WEBP, or GIF images.');
      return;
    }

    // Check if GIF is animated
    if (file.type === 'image/gif') {
      const isAnimated = await checkIfGifIsAnimated(file);
      if (isAnimated) {
        alert('Animated GIFs are not supported.');
        return;
      }
    }

    try {
      setUploading(true);
      // Compress the image to <=250KB
      const options = {
        maxSizeMB: 0.25, // 0.25 MB = 250 KB
        maxWidthOrHeight: 1920, // Adjust as needed
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Convert to Base64
      const base64 = await convertToBase64(compressedFile);
      setSelectedImage(base64);
      setUploadedFile(base64); // Set uploaded file
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  // Helper function to check if GIF is animated
  const checkIfGifIsAnimated = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const buffer = e.target?.result;
        if (buffer && typeof buffer !== 'string') {
          const view = new DataView(buffer);
          let isAnimated = false;
          // Simple check for multiple frames in GIF
          for (let i = 0; i < view.byteLength - 9; i++) {
            if (
              view.getUint32(i) === 0x00021f9a &&
              view.getUint8(i + 8) === 0x04 &&
              view.getUint8(i + 9) === 0x00
            ) {
              isAnimated = true;
              break;
            }
          }
          resolve(isAnimated);
        } else {
          resolve(false);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper function to convert file to Base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() || selectedImage) { // Allow sending if there is text or an image
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
        image: selectedImage || undefined, // Attach image if available
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

      setInputMessage('');
      setSelectedImage(null); // Reset selected image
      setUploadedFile(null); // Reset uploaded file
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

  const ChatHistory = () => {
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

    return (
      <div className="p-4 space-y-2">
        {Object.entries(chatGroups).map(([group, groupChats]) => (
          groupChats.length > 0 && (
            <div key={group}>
              <h3 className="text-sm font-semibold mb-2 text-gray-600">{group}</h3>
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
                        onClick={() => handleChatSelect(chat.id)}
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
                            handleDeleteChat(chat.id);
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
        ))}
      </div>
    );
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

  const MessageBubble = ({ message }: { message: Message }) => {
    return (
      <div
        className={`flex items-start space-x-2 ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        } relative`}
      >
        {message.role === 'assistant' && (
          <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
            <AvatarImage src="/images/sshift-guy.png" alt="AI Avatar" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        )}
        <div
          className={`max-w-[70%] rounded-lg p-4 ${
            message.role === 'user' ? 'bg-blue-100 text-black' : 'bg-gray-100'
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
                <h1 className="text-2xl font-bold mb-2">{children}</h1>
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
          {message.image && (
            <img
              src={message.image}
              alt="Uploaded Image"
              className="mt-2 max-w-xs rounded cursor-pointer hover:opacity-80"
              style={{ width: '75%' }} // Render image 25% smaller
            />
          )}
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
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ChatSidebar */}
      <div className="w-80 border-r border-border bg-background hidden md:block">
        <div className="p-4 border-b border-border h-[73px] flex items-center">
          <h2 className="text-lg font-semibold">Chat History</h2>
        </div>
        <ScrollArea className="h-[calc(100%-73px)]">
          <ChatHistory />
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
            {currentChat?.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        {/* ChatInput */}
        <div className="border-t border-border p-4 w-full relative">
          <div className="flex items-end space-x-2 max-w-6xl mx-auto">
            <div className="relative flex-1">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here... (Ctrl+Enter to send)"
                className="flex-1"
              />
            </div>
            {/* Hidden File Input */}
            <input
              type="file"
              accept=".png, .jpeg, .jpg, .webp, .gif"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
            />
            {/* Image Upload Button */}
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 hover:bg-gray-200 relative"
              onClick={handleImageButtonClick}
              disabled={uploading}
            >
              {uploading ? (
                <Upload className="animate-spin h-4 w-4" /> // Rotating upload icon
              ) : (
                <Image className="h-4 w-4" />
              )}
              {uploadedFile && ( // Render uploaded file representation
                <div className="absolute top-[-40px] right-0 flex items-center">
                  <img
                    src={uploadedFile}
                    alt="Uploaded Preview"
                    className="h-8 w-8 rounded border border-gray-300"
                  />
                  <button
                    className="ml-2 text-red-500"
                    onClick={() => setUploadedFile(null)} // Remove uploaded file
                  >
                    &times; {/* Close icon */}
                  </button>
                </div>
              )}
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