import React from 'react';
import { Input } from './input';
import Link from 'next/link';
import config from '../../../config/dashboard_config.json';
import { useAppManagment } from '../../../src/context/AppManagment';

export const UserProfileContainer = () => {
  const { isSubscriptionActive, expirationDate, moveBotsOwned, qribbleNFTsOwned, sshiftRecordsOwned } = useAppManagment();

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Subscription Status:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isSubscriptionActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {isSubscriptionActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Expiry Date:</span>
          <div className="bg-gray-100 px-3 py-1 rounded">
            <span className="text-sm text-gray-600">
              {isSubscriptionActive ? expirationDate : '-'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Move Bot owned:</span>
            <Link
              href={config.MOVEBOT_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-700 block"
            >
              Buy
            </Link>
          </div>
          <Input
            type="number"
            value={moveBotsOwned}
            className="w-16 text-right bg-gray-100"
            readOnly
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Qribble NFT owned:</span>
            <Link
              href={config.QRIBBLE_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-700 block"
            >
              Buy
            </Link>
          </div>
          <Input
            type="number"
            value={qribbleNFTsOwned}
            className="w-16 text-right bg-gray-100"
            readOnly
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">SShift Records owned:</span>
            <Link
              href={config.SSHIFT_RECORDS_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-700 block"
            >
              Buy
            </Link>
          </div>
          <Input
            type="number"
            value={sshiftRecordsOwned}
            className="w-16 text-right bg-gray-100"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};
