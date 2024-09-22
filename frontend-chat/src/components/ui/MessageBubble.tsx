import React from 'react';
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
        onClick={() => onCopy(value)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function MessageBubble({ message, onCopy }: MessageBubbleProps) {
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
            alt="Uploaded Image"
            className="mt-2 max-w-xs rounded cursor-pointer hover:opacity-80"
            style={{ width: '75%' }}
          />
        )}
        {message.role === 'assistant' && (
          <div className="flex space-x-2 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-200"
              onClick={() => onCopy(message.content)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-gray-200">
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-gray-200">
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
}