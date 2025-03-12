import React, { useState, useMemo, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import { ImageThumbnail } from './ImageThumbnail';
import { AudioPlayer } from './AudioPlayer';
import { AssistantButtonArray } from './assistantButtonArray';
import { UserButtonArray } from './userButtonArray';
import { IMessage } from '@helpers';
import { MathRender } from './mathRender';
import TwitterMentionsRenderer from './TwitterMentionsRenderer';

interface MessageBubbleProps {
  message: IMessage;
  onCopy: (text: string) => void;
  onRegenerate: (message: IMessage) => void;
  onEdit: (message: IMessage, newContent: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onCopy,
  onRegenerate,
  onEdit,
}) => {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [parsedContent, setParsedContent] = useState<{
    text: string;
    images?: string[];
    twitterData?: any;
  }>({ text: message.content });
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [expandedThumbnailIndex, setExpandedThumbnailIndex] = useState<
    number | null
  >(null);
  
  // Add a ref to track if content has been processed to prevent infinite loops
  const contentProcessedRef = useRef(false);

  // Extract audio URLs before rendering
  const audioUrls = useMemo(() => {
    const urls: string[] = [];
    const soundEffectRegex = /\[Sound Effect: (.*?)\]\((.*?\.mp3)\)/g;
    let match;

    // Find all sound effect matches
    while ((match = soundEffectRegex.exec(parsedContent.text)) !== null) {
      urls.push(match[2]);
    }

    // Find all direct .mp3 links
    const mp3LinkRegex = /\[(.*?)\]\((.*?\.mp3)\)/g;
    while ((match = mp3LinkRegex.exec(parsedContent.text)) !== null) {
      if (!urls.includes(match[2])) {
        urls.push(match[2]);
      }
    }

    return urls;
  }, [parsedContent.text]);

  // Check if content contains Twitter mentions
  const containsTwitterMentions = useMemo(() => {
    return (
      parsedContent.text.includes('mentions of cryptocurrency on Twitter') ||
      parsedContent.text.includes('crypto mentions on Twitter') ||
      (parsedContent.text.includes('crypto mentions') && parsedContent.text.includes('Twitter')) ||
      parsedContent.twitterData !== undefined
    );
  }, [parsedContent.text, parsedContent.twitterData]);

  // Add this function before the useEffect
  const safelyParseTwitterData = useMemo(() => {
    // Don't reprocess if not needed
    if (!message.content || contentProcessedRef.current) return null;
    
    try {
      // Check if the content is JSON that might contain Twitter data
      const contentObj = JSON.parse(message.content);
      
      // Check for Twitter data in different possible structures
      if (
        contentObj.final_message?.twitter_mentions ||
        contentObj.twitter_mentions ||
        (contentObj.final_message?.content && 
         typeof contentObj.final_message.content === 'string' &&
         (contentObj.final_message.content.includes('Twitter') || 
          contentObj.final_message.content.includes('mentions')))
      ) {
        // For structured Twitter data
        if (contentObj.final_message?.twitter_mentions || contentObj.twitter_mentions) {
          const mentions = contentObj.final_message?.twitter_mentions || contentObj.twitter_mentions;
          return {
            text: contentObj.final_message?.content || contentObj.content || message.content,
            twitterData: mentions,
            images: contentObj.final_message?.images || contentObj.images || []
          };
        }
        
        // For Twitter data embedded as text
        return {
          text: contentObj.final_message?.content || contentObj.content || message.content,
          images: contentObj.final_message?.images || contentObj.images || []
        };
      }
      
      // Standard JSON formatting
      if (contentObj.final_message) {
        return {
          text: contentObj.final_message.content,
          images: contentObj.final_message.images || []
        };
      }
      
      return null;
    } catch (e) {
      // Not JSON or parsing failed
      return null;
    }
  }, [message.content]);

  React.useEffect(() => {
    // Reset the ref when message content changes
    contentProcessedRef.current = false;
  }, [message.content]);

  React.useEffect(() => {
    // Only process the content if it hasn't been processed yet
    if (contentProcessedRef.current) return;
    
    // Use the memoized parser result if available
    const parsedResult = safelyParseTwitterData;
    if (parsedResult) {
      contentProcessedRef.current = true;
      setParsedContent({
        text: parsedResult.text,
        images: parsedResult.images,
        twitterData: parsedResult.twitterData
      });
      return;
    }
    
    try {
      // Set the ref to true to prevent re-processing
      contentProcessedRef.current = true;
      
      const contentObj = JSON.parse(message.content);
      if (contentObj.final_message) {
        setParsedContent({
          text: contentObj.final_message.content,
          images: contentObj.final_message.images || [],
        });
      } else {
        setParsedContent({ text: message.content });
      }
    } catch (e) {
      // For non-JSON content, just set it directly
      contentProcessedRef.current = true;
      setParsedContent({ text: message.content });
    }
  }, [message.content, safelyParseTwitterData]);

  // Add useEffect to sync editedContent with message.content when edit mode changes
  React.useEffect(() => {
    if (isEditing) {
      setEditedContent(message.content);
    }
  }, [isEditing, message.content]);

  const handleEditClick = () => {
    if (isEditing) {
      onEdit(message, editedContent);
      setIsEditing(false);
    } else {
      setEditedContent(message.content); // Also set content when entering edit mode
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

    if (isUser) {
      return (
        <>
          <div className="whitespace-pre-wrap break-words text-sm min-[768px]:text-base overflow-x-auto max-w-full">
            {parsedContent.text}
          </div>

          {message.images && message.images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {message.images.map((imageUrl, index) => (
                <ImageThumbnail
                  key={`${imageUrl}-${index}`}
                  src={imageUrl}
                  onClick={() => setExpandedImage(imageUrl)}
                  isExpanded={false}
                  isAssistantMessage={false}
                />
              ))}
            </div>
          )}

          {expandedImage && (
            <div className="mt-4">
              <img
                src={expandedImage}
                alt="Expanded view"
                className="w-full h-auto rounded cursor-pointer"
                onClick={() => setExpandedImage(null)}
              />
            </div>
          )}

          {audioUrls.length > 0 && (
            <div className="mt-2 space-y-2">
              {audioUrls.map((url, index) => (
                <AudioPlayer key={`${url}-${index}`} src={url} />
              ))}
            </div>
          )}
        </>
      );
    }

    // Special handling for Twitter mentions data using the dedicated component
    if (containsTwitterMentions) {
      return (
        <TwitterMentionsRenderer
          content={parsedContent.text}
          mentions={parsedContent.twitterData}
          images={parsedContent.images}
          onImageClick={(index) => setExpandedThumbnailIndex(
            expandedThumbnailIndex === index ? null : index
          )}
          expandedImageIndex={expandedThumbnailIndex}
        />
      );
    }

    return (
      <>
        <MathRender
          content={parsedContent.text}
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
            h1: ({ children }: any) => (
              <h1 className="text-base font-bold mb-2 min-[768px]:text-2xl">
                {children}
              </h1>
            ),
            h2: ({ children }: any) => (
              <h2 className="text-sm font-bold mb-2 min-[768px]:text-xl">
                {children}
              </h2>
            ),
            h3: ({ children }: any) => (
              <h3 className="text-sm font-bold mb-2 min-[768px]:text-lg">
                {children}
              </h3>
            ),
            p: ({ children }: any) => (
              <div className="mb-2 text-sm min-[768px]:text-base">
                {children}
              </div>
            ),
            a: ({ href, children }: any) => {
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
            ul: ({ children }: any) => (
              <ul className="list-disc pl-4 mb-2">{children}</ul>
            ),
            ol: ({ children }: any) => (
              <ol className="list-decimal pl-4 mb-2">{children}</ol>
            ),
            li: ({ children }: any) => <li className="mb-1">{children}</li>,
            img: ({ src, alt }: any) => (
              <ImageThumbnail
                src={src || ''}
                onClick={() =>
                  isUser
                    ? setExpandedImage(src || '')
                    : setExpandedThumbnailIndex(
                        expandedThumbnailIndex === 0 ? null : 0
                      )
                }
                isExpanded={!isUser && expandedThumbnailIndex === 0}
                isAssistantMessage={!isUser}
              />
            ),
          }}
          className="prose max-w-none"
        />

        {message.images && message.images.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {message.images.map((imageUrl, index) => (
              <ImageThumbnail
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                onClick={() =>
                  isUser
                    ? setExpandedImage(imageUrl)
                    : setExpandedThumbnailIndex(
                        expandedThumbnailIndex === index ? null : index
                      )
                }
                isExpanded={!isUser && expandedThumbnailIndex === index}
                isAssistantMessage={!isUser}
              />
            ))}
          </div>
        )}

        {isUser && expandedImage && (
          <div className="mt-4">
            <img
              src={expandedImage}
              alt="Expanded view"
              className="w-full h-auto rounded cursor-pointer"
              onClick={() => setExpandedImage(null)}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
          <AvatarImage src="/images/sshift-guy.png" alt="AI Avatar" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[75%] w-auto p-3 rounded-lg shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_16px_-1px_rgba(0,0,0,0.3)] transition-shadow duration-200 transform hover:-translate-y-0.5 ${
          isUser ? 'bg-[#B7D6E9] text-black' : 'bg-gray-200 text-gray-800'
        } text-sm min-[768px]:text-base overflow-hidden overflow-x-auto`}
      >
        <div className="prose prose-sm max-w-none min-[768px]:prose-base !prose-h1:text-base !prose-h2:text-sm !prose-h3:text-sm !prose-p:text-sm min-[768px]:!prose-h1:text-2xl min-[768px]:!prose-h2:text-xl min-[768px]:!prose-h3:text-lg min-[768px]:!prose-p:text-base [&_code]:break-words [&_code]:whitespace-pre-wrap [&_p]:break-words [&_p]:whitespace-pre-wrap">
          {renderContent()}
        </div>

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
};
