import React, { memo } from 'react';
import { Tweet } from 'react-tweet';
import '../../styles/tweet-styles.css';

interface TwitterMentionsProps {
  content?: string;
}

export const TwitterMentionsRenderer: React.FC<TwitterMentionsProps> = memo(({ content }) => {
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

  const tweetIds = extractTweetIds(content);

  // If no tweet IDs found, fallback to the text format
  if (tweetIds.length === 0) {
    // Process the content to make Twitter links clickable
    const processedContent = content
      .replace(
        /\[Original Tweet\]\((https:\/\/twitter\.com\/[^)]+)\)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">View Tweet</a>'
      )
      // Convert numbered tweets from asterisk formatting to HTML
      .replace(
        /(\d+)\.\s+\*\*([^*]+)\*\*\s*:?/g,
        '<div class="tweet-header"><span class="tweet-number">$1.</span> <span class="tweet-author">$2</span></div>'
      )
      // Format content blocks
      .replace(
        /\*\*Content\*\*:\s*"([^"]*)"/g,
        '<div class="content-label">Content:</div><div class="tweet-content">"$1"</div>'
      )
      // Format metrics
      .replace(
        /\*\*Likes\*\*:\s*([0-9,]+)/g,
        '<div class="tweet-metric"><span class="metric-label">Likes:</span> <span class="metric-value">$1</span></div>'
      )
      .replace(
        /\*\*Quotes\*\*:\s*([0-9,]+)/g,
        '<div class="tweet-metric"><span class="metric-label">Quotes:</span> <span class="metric-value">$1</span></div>'
      )
      .replace(
        /\*\*Replies\*\*:\s*([0-9,]+)/g,
        '<div class="tweet-metric"><span class="metric-label">Replies:</span> <span class="metric-value">$1</span></div>'
      )
      .replace(
        /\*\*Reposts\*\*:\s*([0-9,]+)/g,
        '<div class="tweet-metric"><span class="metric-label">Reposts:</span> <span class="metric-value">$1</span></div>'
      )
      .replace(
        /\*\*Views\*\*:\s*([0-9,]+)/g,
        '<div class="tweet-metric"><span class="metric-label">Views:</span> <span class="metric-value">$1</span></div>'
      );

    return (
      <div className="twitter-mentions-direct">
        <div 
          className="whitespace-pre-wrap tweets-container" 
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </div>
    );
  }

  // Use the react-tweet library to render actual tweet embeds
  return (
    <div className="twitter-embeds-container">
      {tweetIds.map((id) => (
        <div key={id} className="tweet-embed-wrapper my-3">
          <Tweet id={id} />
        </div>
      ))}
    </div>
  );
});

TwitterMentionsRenderer.displayName = 'TwitterMentionsRenderer';

export default TwitterMentionsRenderer; 