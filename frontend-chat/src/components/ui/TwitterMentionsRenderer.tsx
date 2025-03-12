import React, { memo, useMemo } from 'react';
import { ImageThumbnail } from './ImageThumbnail';
import { Tweet } from 'react-tweet';

interface TwitterMention {
  username: string;
  handle: string;
  content: string;
  likes?: number;
  retweets?: number;
  comments?: number;
  views?: number;
  timestamp?: string;
  id?: string; // Tweet ID for react-tweet
}

interface TwitterMentionsRendererProps {
  content: string;
  mentions?: TwitterMention[];
  images?: string[];
  onImageClick?: (index: number) => void;
  expandedImageIndex?: number | null;
}

/**
 * A dedicated component for rendering Twitter mentions data
 * Uses react-tweet for authentic Twitter styling and functionality
 */
export const TwitterMentionsRenderer = memo(({
  content,
  mentions,
  images,
  onImageClick,
  expandedImageIndex
}: TwitterMentionsRendererProps) => {
  // Extract tweet IDs if present in the content
  const extractTweetIds = (text: string): { id: string, url: string }[] => {
    try {
      const regex = /\*\*\[Original Tweet\]\(https:\/\/twitter\.com\/\w+\/status\/(\d+)\)\*\*/g;
      const matches: { id: string, url: string }[] = [];
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const url = match[0].match(/\(([^)]+)\)/)?.[1] || '';
        matches.push({ 
          id: match[1],
          url
        });
      }
      
      return matches;
    } catch (error) {
      console.error('Error extracting tweet IDs:', error);
      return [];
    }
  };
  
  // Parse the numbered tweet format
  const parseNumberedTweetFormat = useMemo(() => {
    try {
      // Extract the introduction text (everything before the first numbered item)
      const introText = content.split(/\d+\.\s+\*\*@/)[0]?.trim() || '';
      
      // Extract each numbered tweet section
      const tweetSections: string[] = [];
      const sectionRegex = /(\d+\.\s+\*\*@[\w\W]*?)(?=\d+\.\s+\*\*@|$)/g;
      let match;
      
      while ((match = sectionRegex.exec(content)) !== null) {
        if (match[1]) tweetSections.push(match[1]);
      }
      
      // Extract tweet IDs
      const tweetData = extractTweetIds(content);
      
      const parsedTweets = tweetSections.map((section, index) => {
        // Extract username
        const usernameMatch = section.match(/\d+\.\s+\*\*@([^*]+)\*\*/);
        const username = usernameMatch ? usernameMatch[1] : '';
        
        // Extract content
        const contentMatch = section.match(/\*\*Content:\*\*\s*"([^"]*)"/);
        const contentAltMatch = section.match(/\*\*Content:\*\*\s*(.*?)(?=\n|$)/);
        const tweetContent = contentMatch 
          ? contentMatch[1].replace(/\\"/g, '"') 
          : (contentAltMatch ? contentAltMatch[1].trim() : '');
        
        // Extract likes, replies, reposts
        const likesMatch = section.match(/\*\*Likes:\*\*\s*(\d+)/);
        const repliesMatch = section.match(/\*\*Replies:\*\*\s*(\d+)/);
        const repostsMatch = section.match(/\*\*Reposts:\*\*\s*(\d+)/);
        
        // Extract posted time
        const postedMatch = section.match(/\*\*Posted:\*\*\s*([^\n]*)/);
        const timestamp = postedMatch ? postedMatch[1] : '';
        
        // Get tweet ID if available
        const tweetId = tweetData[index]?.id || '';
        const tweetUrl = tweetData[index]?.url || '';
        
        return {
          index: index + 1,
          username,
          handle: `@${username}`,
          content: tweetContent,
          likes: likesMatch ? parseInt(likesMatch[1], 10) : 0,
          replies: repliesMatch ? parseInt(repliesMatch[1], 10) : 0,
          reposts: repostsMatch ? parseInt(repostsMatch[1], 10) : 0,
          timestamp,
          id: tweetId,
          url: tweetUrl,
          rawSection: section
        };
      });
      
      return {
        introText,
        parsedTweets,
        tweetIds: tweetData.map(t => t.id)
      };
    } catch (error) {
      console.error('Error parsing numbered tweet format:', error);
      return {
        introText: '',
        parsedTweets: [],
        tweetIds: []
      };
    }
  }, [content]);
  
  // Format timestamp to a more readable format
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  };
  
  // If we have parsed tweets from the numbered format
  if (parseNumberedTweetFormat.parsedTweets.length > 0) {
    return (
      <div className="twitter-mentions-container">
        {parseNumberedTweetFormat.introText && (
          <div className="prose max-w-none mb-4">
            <p>{parseNumberedTweetFormat.introText}</p>
          </div>
        )}
        
        <div className="space-y-6">
          {parseNumberedTweetFormat.parsedTweets.map((tweet, index) => (
            <div key={index} className="tweet-item">
              <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                {tweet.index}. <span className="font-bold text-blue-500">@{tweet.username}</span>
              </div>
              
              {/* Tweet content summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm mb-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300 font-bold">
                      {tweet.username?.charAt(0) || '@'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="font-bold text-gray-900 dark:text-gray-100">@{tweet.username}</p>
                    </div>
                    {tweet.content && (
                      <p className="text-gray-800 dark:text-gray-200 mt-1">{tweet.content}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center text-gray-500 dark:text-gray-400 text-sm">
                      {tweet.likes > 0 && (
                        <span className="mr-4 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span className="font-semibold">{tweet.likes}</span>
                        </span>
                      )}
                      {tweet.replies > 0 && (
                        <span className="mr-4 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67c0-.414-.335-.75-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z" />
                          </svg>
                          <span className="font-semibold">{tweet.replies}</span>
                        </span>
                      )}
                      {tweet.reposts > 0 && (
                        <span className="mr-4 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.336-.75-.75-.75z" />
                          </svg>
                          <span className="font-semibold">{tweet.reposts}</span>
                        </span>
                      )}
                      {tweet.timestamp && (
                        <span className="mb-1">{tweet.timestamp}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Embedded tweet if ID is available */}
              {tweet.id && (
                <div className="ml-6 mb-4">
                  <Tweet id={tweet.id} />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {images && images.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {images.map((imageUrl, index) => (
              <ImageThumbnail
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                onClick={() => onImageClick && onImageClick(index)}
                isExpanded={expandedImageIndex === index}
                isAssistantMessage={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // If we have mentions data directly provided
  if (mentions && mentions.length > 0) {
    return (
      <div className="twitter-mentions-container">
        <div className="space-y-4">
          {mentions.map((mention, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300 font-bold">
                    {mention.username?.charAt(0) || '@'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{mention.username}</p>
                    <p className="ml-2 text-gray-500 dark:text-gray-400">{mention.handle}</p>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 mt-1">{mention.content}</p>
                  <div className="mt-2 flex flex-wrap items-center text-gray-500 dark:text-gray-400 text-sm">
                    {mention.likes !== undefined && (
                      <span className="mr-4 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span className="font-semibold">{mention.likes}</span>
                      </span>
                    )}
                    {mention.retweets !== undefined && (
                      <span className="mr-4 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.336-.75-.75-.75z" />
                        </svg>
                        <span className="font-semibold">{mention.retweets}</span>
                      </span>
                    )}
                    {mention.comments !== undefined && (
                      <span className="mr-4 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67c0-.414-.335-.75-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z" />
                        </svg>
                        <span className="font-semibold">{mention.comments}</span>
                      </span>
                    )}
                    {mention.views !== undefined && (
                      <span className="mr-4 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                        <span className="font-semibold">{mention.views}</span>
                      </span>
                    )}
                    {mention.timestamp && (
                      <span className="mb-1">{formatTimestamp(mention.timestamp)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {images && images.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {images.map((imageUrl, index) => (
              <ImageThumbnail
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                onClick={() => onImageClick && onImageClick(index)}
                isExpanded={expandedImageIndex === index}
                isAssistantMessage={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Fallback to the original content if we couldn't parse tweets
  return (
    <div className="twitter-mentions-container">
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
      </div>
      
      {images && images.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {images.map((imageUrl, index) => (
            <ImageThumbnail
              key={`${imageUrl}-${index}`}
              src={imageUrl}
              onClick={() => onImageClick && onImageClick(index)}
              isExpanded={expandedImageIndex === index}
              isAssistantMessage={true}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TwitterMentionsRenderer.displayName = 'TwitterMentionsRenderer';

export default TwitterMentionsRenderer; 