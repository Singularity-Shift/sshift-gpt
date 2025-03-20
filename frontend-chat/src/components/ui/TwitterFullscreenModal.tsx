import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Tweet } from 'react-tweet';
import { useTheme } from 'next-themes';

interface TwitterFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweetId: string;
}

export const TwitterFullscreenModal: React.FC<TwitterFullscreenModalProps> = ({
  isOpen,
  onClose,
  tweetId,
}) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const isMobile = viewportWidth <= 768;

  // Update viewport dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';

      // Restore original style when modal closes
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Add meta viewport tag to prevent zooming issues on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      // Save the current viewport meta tag content
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      const originalContent = viewportMeta?.getAttribute('content');

      // Set viewport meta to prevent scaling/zooming
      if (viewportMeta) {
        viewportMeta.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }

      // Restore original viewport meta content when modal closes
      return () => {
        if (viewportMeta && originalContent) {
          viewportMeta.setAttribute('content', originalContent);
        }
      };
    }
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 tweet-fullscreen-modal ${
        isDarkTheme ? 'dark-theme' : 'light-theme'
      }`}
      onClick={onClose} // Close when clicking the backdrop
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden tweet-modal-content"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the modal content
      >
        <div className="flex justify-between items-center p-3 sm:p-4 border-b dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold dark:text-white">
            Tweet
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 dark:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-2 sm:p-4">
          <div className="tweet-fullscreen-container">
            <Tweet
              id={tweetId}
              // Set theme based on the app's theme
            />
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('root') || document.body
  );
};

export default TwitterFullscreenModal;
