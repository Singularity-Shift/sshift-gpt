'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      content: 'Hi mate, give me a short python script, something simple.',
    },
    {
      id: 2,
      sender: 'assistant',
      content:
        "Hello! I'm here to assist you with any questions or tasks you may have. Here's a simple Python script that defines a function to greet a user by name and then calls that function:\n\n```python\n# Define a function to greet a user by name\n\ndef greet(name):\n    print(f'Hello, {name}!')\n\n# Call the function with a sample name\ngreet('World')\n```",
    },
  ]);
  const [chats, setChats] = useState([
    { id: 1, summary: 'Math help' },
    { id: 2, summary: 'Code assistance' },
    { id: 3, summary: 'Announcement help' },
  ]);

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'user',
        content: inputMessage,
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, newMessage],
            model: selectedModel,
          }),
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const assistantMessage = {
          id: messages.length + 2,
          sender: 'assistant',
          content: '',
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim() !== '');
          for (const line of lines) {
            if (line === 'data: [DONE]') {
              setMessages([...messages, newMessage, assistantMessage]);
              return;
            }
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));
              if (
                data.choices &&
                data.choices[0] &&
                data.choices[0].delta &&
                data.choices[0].delta.content
              ) {
                assistantMessage.content += data.choices[0].delta.content;
                setMessages([...messages, newMessage, { ...assistantMessage }]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    // Additional logic for starting a new chat
  };

  const handleDisconnect = () => {
    // Implement logout logic here
    console.log('User disconnected');
    // Redirect to home page
    router.push('/');
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
          className="absolute bottom-2 right-2 hover:bg-gray-200"
          onClick={() => handleCopy(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ChatSidebar */}
      <div className="w-64 border-r border-border bg-background hidden md:block">
        <div className="p-4 border-b border-border h-[73px] flex items-center">
          <h2 className="text-lg font-semibold">Chat History</h2>
        </div>
        <ScrollArea className="h-[calc(100%-73px)]">
          <div className="p-4 space-y-2">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start"
              >
                {chat.summary}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 items-center">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border h-[73px] w-full">
          <div className="flex items-center space-x-4">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
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
            <Button onClick={handleDisconnect} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>

        {/* ChatWindow */}
        <ScrollArea className="flex-1 p-4 w-full max-w-6xl">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                } relative`}
              >
                {message.sender === 'assistant' && (
                  <Avatar className="w-8 h-8 mr-2">
                    <AvatarImage src="/images/sshift-guy.png" alt="AI Avatar" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-muted text-black'
                      : 'bg-muted'
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
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.sender === 'assistant' && (
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
                        <Volume2 className="h-4 w-4" />
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
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* ChatInput */}
        <div className="border-t border-border p-4 w-full">
          <div className="flex items-end space-x-2 max-w-6xl mx-auto">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 hover:bg-gray-200"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
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
