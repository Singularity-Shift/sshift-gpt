'use client';
import React, { memo, useEffect, useState } from 'react';
import { Tweet } from 'react-tweet';
import '../../styles/tweet-styles.css';
import TwitterFullscreenModal from './TwitterFullscreenModal';

interface TwitterMentionsProps {
  content?: string;
}

export const TwitterMentionsRenderer: React.FC<TwitterMentionsProps> = memo(
  ({ content }) => {
    const [screenSizeClass, setScreenSizeClass] = useState('');
    const [windowWidth, setWindowWidth] = useState(0);
    const [fullscreenTweetId, setFullscreenTweetId] = useState<string | null>(
      null
    );

    // Check screen size for responsive styling
    useEffect(() => {
      const checkScreenSize = () => {
        const width = window.innerWidth;
        setWindowWidth(width);

        // Use general screen size breakpoints
        if (width <= 430) {
          setScreenSizeClass('xs-screen');
        } else if (width <= 640) {
          setScreenSizeClass('sm-screen');
        } else if (width <= 768) {
          setScreenSizeClass('md-screen');
        } else {
          setScreenSizeClass('lg-screen');
        }
      };

      // Initial check
      checkScreenSize();

      // Add event listener for window resize
      window.addEventListener('resize', checkScreenSize);

      // Cleanup
      return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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
      const tweetUrlRegex =
        /https:\/\/(?:twitter|x)\.com\/[^\/]+\/status\/(\d+)/g;
      let match;

      while ((match = tweetUrlRegex.exec(text)) !== null) {
        if (match[1]) {
          ids.push(match[1]);
        }
      }

      return ids;
    };

    const tweetIds = extractTweetIds(content);

    // Handle double click/tap on tweet to open fullscreen modal
    const handleTweetDoubleClick = (
      id: string,
      e: React.MouseEvent | React.TouchEvent
    ) => {
      // Check if the click/tap was on an interactive element (link, button)
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button');

      // Only open fullscreen if not clicking on an interactive element
      if (!isInteractive) {
        e.preventDefault();
        e.stopPropagation();
        setFullscreenTweetId(id);
      }
    };

    // Handle double tap for mobile devices
    const touchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const lastTapRef = React.useRef<number>(0);

    const handleTweetTouchStart = (id: string, e: React.TouchEvent) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // ms

      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        handleTweetDoubleClick(id, e);

        // Clear any existing timeout
        if (touchTimeoutRef.current) {
          clearTimeout(touchTimeoutRef.current);
          touchTimeoutRef.current = null;
        }
      } else {
        // First tap - set a timeout to reset if no second tap
        if (touchTimeoutRef.current) {
          clearTimeout(touchTimeoutRef.current);
        }

        touchTimeoutRef.current = setTimeout(() => {
          touchTimeoutRef.current = null;
        }, DOUBLE_TAP_DELAY);
      }

      lastTapRef.current = now;
    };

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

    // Add size-specific class for Tweet container
    const getTweetContainerClass = () => {
      if (windowWidth <= 359) {
        return 'tweet-tiny-container';
      } else if (windowWidth <= 419) {
        return 'tweet-xs-container';
      } else if (windowWidth <= 430) {
        return 'tweet-sm-container';
      }
      return '';
    };

    // Use the react-tweet library to render actual tweet embeds
    return (
      <>
        <div className={`twitter-embeds-outer-container ${screenSizeClass}`}>
          <div
            className="twitter-embeds-container"
            data-theme="light" // Set the theme using data attribute
          >
            {tweetIds.map((id) => (
              <div
                key={id}
                className={`tweet-embed-wrapper my-3 ${getTweetContainerClass()}`}
                onDoubleClick={(e) => handleTweetDoubleClick(id, e)}
                onTouchStart={(e) => handleTweetTouchStart(id, e)}
              >
                <Tweet
                  id={id}
                  // Optional components prop for extreme customization if needed
                  components={
                    windowWidth <= 359
                      ? {
                          // Custom components can be provided for extreme customization
                        }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Fullscreen modal */}
        {fullscreenTweetId && (
          <TwitterFullscreenModal
            isOpen={!!fullscreenTweetId}
            onClose={() => setFullscreenTweetId(null)}
            tweetId={fullscreenTweetId}
          />
        )}
      </>
    );
  }
);

TwitterMentionsRenderer.displayName = 'TwitterMentionsRenderer';

export default TwitterMentionsRenderer;
