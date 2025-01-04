import React from 'react';
import { Input } from './input';
import Link from 'next/link';
import config from '../../../config/dashboard_config.json';
import { useAppManagment } from '../../../src/context/AppManagment';

export const UserProfileContainer = () => {
  const { 
    isSubscriptionActive, 
    expirationDate, 
    moveBotsOwned, 
    qribbleNFTsOwned, 
    sshiftRecordsOwned 
  } = useAppManagment();

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md p-4 md:p-6 lg:p-8">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 lg:mb-8">
        User Profile
      </h2>

      <div className="space-y-3 md:space-y-4 lg:space-y-6">
        {/* Status Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm md:text-base text-gray-600 mb-2 sm:mb-0">
              Subscription Status:
            </span>
            <span
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium ${
                isSubscriptionActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isSubscriptionActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm md:text-base text-gray-600 mb-2 sm:mb-0">
              Expiry Date:
            </span>
            <span className="px-3 py-1.5 bg-gray-100 rounded text-sm md:text-base text-gray-600">
              {isSubscriptionActive ? expirationDate : '-'}
            </span>
          </div>
        </div>

        {/* Assets Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Move Bot', owned: moveBotsOwned, buyLink: config.MOVEBOT_BUY },
            { label: 'Qribble NFT', owned: qribbleNFTsOwned, buyLink: config.QRIBBLE_BUY },
            { label: 'SShift Records', owned: sshiftRecordsOwned, buyLink: config.SSHIFT_RECORDS_BUY },
          ].map((item) => (
            <div 
              key={item.label}
              className="flex flex-col p-3 bg-gray-50 rounded-lg space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm md:text-base text-gray-600">
                  {item.label} owned:
                </span>
                <Input
                  type="number"
                  value={item.owned}
                  className="w-24 md:w-28 text-right bg-gray-100"
                  readOnly
                />
              </div>
              <Link
                href={item.buyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Buy {item.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
