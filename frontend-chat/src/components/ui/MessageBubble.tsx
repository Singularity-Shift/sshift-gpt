import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Button } from './button';
import { Copy, Volume2, RefreshCw, Edit2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AssistantButtonArray } from './assistantButtonArray';
import { UserButtonArray } from './userButtonArray';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created?: number;
  model?: string;
  finish_reason?: string;
  system_fingerprint?: string;
  image?: string;
}

interface CodeBlockProps {
  language: string;
  value: string;
  onCopy: (text: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, onCopy }) => {
  return (
    <div className="relative">
      <div className="flex justify-between items-center bg-gray-800 text-white p-2 rounded-t">
        <span className="text-sm">{language}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onCopy(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={materialDark}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void;
  onEdit: (message: Message, newContent: string) => void;
}

const ImageThumbnail: React.FC<{ src: string }> = ({ src }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const imageKey = useRef(Math.random().toString(36).substring(7));

  return (
    <div className="mt-2" key={imageKey.current}>
      <img
        src={src}
        alt="Generated or Uploaded"
        className={`cursor-pointer rounded ${
          isExpanded
            ? 'max-w-full h-auto'
            : 'max-w-[200px] max-h-[200px] object-cover'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      />
    </div>
  );
};

const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
      <Volume2 className="h-4 w-4" />
      <audio controls className="w-full max-w-md">
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export function MessageBubble({ message, onCopy, onRegenerate, onEdit }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [parsedContent, setParsedContent] = useState<{ 
    text: string; 
    images?: string[] 
  }>({ text: message.content });

  useEffect(() => {
    try {
        const contentObj = JSON.parse(message.content);
        if (contentObj.final_message) {
            setParsedContent({
                text: contentObj.final_message.content,
                images: contentObj.final_message.images || [] // Handle array of images
            });
        } else {
            setParsedContent({ text: message.content });
        }
    } catch (e) {
        setParsedContent({ text: message.content });
    }
  }, [message.content]);

  const handleEditClick = () => {
    if (isEditing) {
      onEdit(message, editedContent);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const renderContent = () => {
    if (isUser && isEditing) {
      return (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full bg-white text-black p-2 rounded"
        />
      );
    }

    return (
      <>
        <ReactMarkdown
          components={{
            a: ({ href, children }) => {
              if (href && href.endsWith('.mp3')) {
                return <AudioPlayer src={href} />;
              }
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-800 hover:underline"
                >
                  {children}
                </a>
              );
            },
            p: ({ children }) => {
              const text = String(children);
              const soundEffectRegex = /\[Sound Effect:?\s*(?:\[(.*?)\])?\((.*?\.mp3)\)|\[Sound Effect:?\s*(.*?\.mp3)\]/;
              const match = text.match(soundEffectRegex);

              if (match) {
                const audioUrl = match[2] || match[3];
                return (
                  <>
                    <p className="mb-2">
                      {text.replace(soundEffectRegex, '')}
                    </p>
                    <AudioPlayer src={audioUrl} />
                  </>
                );
              }

              return <p className="mb-2">{children}</p>;
            },
          }}
          className="prose max-w-none"
        >
          {parsedContent.text}
        </ReactMarkdown>

        {parsedContent.images?.map((imageUrl, index) => (
          <ImageThumbnail key={`${imageUrl}-${index}`} src={imageUrl} />
        ))}

        {isUser && message.image && (
          <ImageThumbnail src={message.image} />
        )}
      </>
    );
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
          isUser ? 'bg-[#B7D6E9] text-black' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {renderContent()}
        {!isUser && (
          <AssistantButtonArray
            onCopy={onCopy}
            onRegenerate={() => onRegenerate(message)}
            content={message.content}
          />
        )}
        {isUser && (
          <UserButtonArray
            onEdit={(newContent) => onEdit(message, newContent)}
            content={message.content}
          />
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
