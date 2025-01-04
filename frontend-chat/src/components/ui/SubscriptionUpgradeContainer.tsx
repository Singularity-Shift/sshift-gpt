import React from 'react';
import { useAppManagment } from '@fn-chat/context/AppManagment';

export const SubscriptionUpgradeContainer = () => {
  const { isSubscriptionActive } = useAppManagment();

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md p-4 md:p-6 lg:p-8">
      <div className="space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">
            Upgrade Subscription
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Enhance your experience with premium features
          </p>
        </div>

        {/* Content Section - Currently Under Development */}
        <div className="flex flex-col items-center justify-center min-h-[200px] md:min-h-[250px] lg:min-h-[300px] p-6 bg-gray-50 rounded-lg">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto">
              <svg 
                className="w-full h-full text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-base md:text-lg text-gray-600 font-medium">
              Coming Soon
            </p>
            <p className="text-sm md:text-base text-gray-400">
              We're working on exciting new features for our premium subscribers
            </p>
          </div>
        </div>

        {/* Action Button - Disabled while in development */}
        <button
          className="w-full py-3 px-4 bg-gray-100 text-gray-400 rounded-lg 
                     text-sm md:text-base font-medium transition-colors duration-200
                     cursor-not-allowed"
          disabled
        >
          Upgrade Options Coming Soon
        </button>

        {/* Additional Information */}
        <div className="text-xs md:text-sm text-gray-400 text-center">
          <p>Stay tuned for updates on new premium features and upgrade options</p>
        </div>
      </div>
    </div>
  );
};
