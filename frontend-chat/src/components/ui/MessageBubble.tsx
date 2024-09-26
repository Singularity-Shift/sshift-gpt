import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Button } from './button';
import { Copy, Volume2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
  created?: number;
  model?: string;
  finish_reason?: string;
  system_fingerprint?: string;
}

interface MessageBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void; // 1. Add onRegenerate to props
}

const CodeBlock = ({
  language,
  value,
  onCopy,
}: {
  language: string;
  value: string;
  onCopy: (text: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Hide the label after 2 seconds
  };

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
        className="absolute top-2 right-2 hover:bg-gray-200 active:bg-gray-300"
        onClick={() => handleCopy(value)}
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && (
        <span className="absolute top-8 right-2 text-xs text-gray-500 bg-white p-1 rounded">
          Copied
        </span>
      )}
    </div>
  );
};

export function MessageBubble({ message, onCopy, onRegenerate }: MessageBubbleProps) { // 2. Destructure onRegenerate
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [audioClicked, setAudioClicked] = useState(false); // New state for audio button

  const handleCopy = (text: string) => {
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Hide the label after 2 seconds
  };

  const handleRegenerate = () => {
    if (message.role === 'assistant') {
      onRegenerate(message); // 3. Call onRegenerate with the current message
    }
  };

  const handleAudioClick = () => {
    setAudioClicked(true);
    setTimeout(() => setAudioClicked(false), 2000); // Hide the label after 2 seconds
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isUser && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
          <AvatarImage src="/images/sshift-guy.png" alt="AI Avatar" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[75%] w-auto p-3 rounded-lg ${
          isUser ? 'bg-[#B7D6E9] text-black' : 'bg-gray-200 text-gray-800' // Updated class for user message bubble
        }`}
      >
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <CodeBlock
                  language={match[1]}
                  value={String(children).replace(/\n$/, '')}
                  onCopy={onCopy}
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
            li: ({ children }) => <li className="mb-1">{children}</li>,
          }}
          className="prose max-w-none"
        >
          {message.content}
        </ReactMarkdown>
        {message.image && (
          <img
            src={message.image}
            alt="Attached"
            className="mt-2 max-w-full rounded"
          />
        )}
        {!isUser && (
          <div className="relative flex space-x-2 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className="active:bg-gray-300"
              onClick={() => handleCopy(message.content)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            {copied && (
              <span className="absolute top-8 left-0 text-xs text-gray-500 bg-white p-1 rounded">
                Copied
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="active:bg-gray-300"
              onClick={handleRegenerate} // 4. Add onClick handler for regenerate
            >
              <RefreshCw className="h-4 w-4" /> {/* Regenerate (Refresh) Icon */}
            </Button>
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="active:bg-gray-300"
                onClick={handleAudioClick}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              {audioClicked && (
                <span className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white p-1 rounded whitespace-nowrap">
                  Coming soon
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="w-8 h-8 ml-2 flex-shrink-0">
          <AvatarImage src="/images/sshift-guy-user.png" alt="User Avatar" />
          <AvatarFallback>User</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}