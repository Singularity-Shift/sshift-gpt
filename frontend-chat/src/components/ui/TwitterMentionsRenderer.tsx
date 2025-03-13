import React, { memo, useEffect, useState } from 'react';
import { Tweet } from 'react-tweet';
import '../../styles/tweet-styles.css';

interface TwitterMentionsProps {
  content?: string;
}

export const TwitterMentionsRenderer: React.FC<TwitterMentionsProps> = memo(({ content }) => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  if (!content) {
    return (
      <div className="p-2 border border-yellow-300 bg-yellow-50 rounded text-sm">
        No Twitter content to display.
      </div>
    );
  }

  // Extract tweet IDs from the content
  const extractTweetIds = (text: string): string[] => {
    const ids: string[] = [];
    
    // Match URLs like https://twitter.com/username/status/1234567890123456789
    const tweetUrlRegex = /https:\/\/(?:twitter|x)\.com\/[^\/]+\/status\/(\d+)/g;
    let match;
    
    while ((match = tweetUrlRegex.exec(text)) !== null) {
      if (match[1]) {
        ids.push(match[1]);
      }
    }
    
    return ids;
  };

  // Extract profile URLs from the content
  const extractProfileUrls = (text: string): string[] => {
    const urls: string[] = [];
    
    // Match profile image URLs
    const profileUrlRegex = /\[Profile Image\]\((https:\/\/[^)]+)\)/g;
    let match;
    
    while ((match = profileUrlRegex.exec(text)) !== null) {
      if (match[1]) {
        urls.push(match[1]);
      }
    }
    
    return urls;
  };

  // Try to extract tweet IDs from the content
  const tweetIds = extractTweetIds(content);
  const profileUrls = extractProfileUrls(content);
  
  // For debugging - log what we found
  useEffect(() => {
    console.log('Content:', content);
    console.log('Tweet IDs found:', tweetIds);
    console.log('Profile URLs found:', profileUrls);
    
    setDebugInfo(`Found ${tweetIds.length} tweet IDs and ${profileUrls.length} profile URLs`);
  }, [content]);

  // If we have tweet IDs, render them using react-tweet
  if (tweetIds.length > 0) {
    return (
      <div className="twitter-embeds-container">
        {tweetIds.map((id) => (
          <div key={id} className="tweet-embed-wrapper my-3">
            <Tweet id={id} />
          </div>
        ))}
      </div>
    );
  }

  // If we have profile URLs, we're likely in the "who is talking" format
  // Process the content to make it look better
  const processedContent = content
    // Format the numbered list items
    .replace(
      /(\d+)\.\s+([^(]+)(\(@[^)]+\))/g,
      '<div class="tweet-header"><span class="tweet-number">$1.</span> <span class="tweet-author">$2</span><span class="tweet-handle">$3</span></div>'
    )
    // Format content sections
    .replace(
      /Content:\s*"([^"]*)"/g,
      '<div class="content-label">Content:</div><div class="tweet-content">"$1"</div>'
    )
    // Format description sections
    .replace(
      /Description:\s*"([^"]*)"/g,
      '<div class="description-label">Description:</div><div class="tweet-description">"$1"</div>'
    )
    // Format metrics sections
    .replace(
      /Metrics:\s*Likes\s*-\s*([0-9,]+)\s*\|\s*Replies\s*-\s*([0-9,]+)\s*\|\s*Reposts\s*-\s*([0-9,]+)\s*\|\s*Views\s*-\s*([0-9,]+)/g,
      '<div class="metrics-container">' +
      '<div class="tweet-metric"><span class="metric-label">Likes:</span> <span class="metric-value">$1</span></div>' +
      '<div class="tweet-metric"><span class="metric-label">Replies:</span> <span class="metric-value">$2</span></div>' +
      '<div class="tweet-metric"><span class="metric-label">Reposts:</span> <span class="metric-value">$3</span></div>' +
      '<div class="tweet-metric"><span class="metric-label">Views:</span> <span class="metric-value">$4</span></div>' +
      '</div>'
    )
    // Make profile image links clickable
    .replace(
      /Profile Image/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="profile-link">View Profile</a>'
    );

  // If no tweet IDs found, fallback to the text format
  return (
    <div className="twitter-mentions-direct">
      <div 
        className="whitespace-pre-wrap tweets-container" 
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      {process.env.NODE_ENV !== 'production' && (
        <div className="debug-info text-xs text-gray-500 mt-2 p-1 border border-gray-200 rounded">
          {debugInfo}
        </div>
      )}
    </div>
  );
});

TwitterMentionsRenderer.displayName = 'TwitterMentionsRenderer';

export default TwitterMentionsRenderer; 