import React from 'react';
import { Input } from './input';
import Link from 'next/link';
import config from '../../../config/dashboard_config.json';
import { useAppManagment } from '../../../src/context/AppManagment';

interface UserProfileContainerProps {
  moveBotsOwned: number;
  qribbleNFTsOwned: number;
  sshiftRecordsOwned: number;
}

export const UserProfileContainer: React.FC<UserProfileContainerProps> = ({
  moveBotsOwned,
  qribbleNFTsOwned,
  sshiftRecordsOwned,
}) => {
  const { isSubscriptionActive, expirationDate } = useAppManagment();

  return (
    <div className="w-[400px] bg-white bg-opacity-90 p-10 rounded-xl shadow-lg flex flex-col border border-gray-300">
      <div>
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            User Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">&nbsp;</p>
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Subscription Status:
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isSubscriptionActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isSubscriptionActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Expiry Date:
            </span>
            <div className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 w-56 text-right">
              <span className="text-sm text-gray-600">
                {isSubscriptionActive ? expirationDate : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-700">
              Move Bot owned:
            </span>
            <Link
              href={config.MOVEBOT_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-800 underline block"
            >
              Buy
            </Link>
          </div>
          <Input
            type="number"
            value={moveBotsOwned}
            className="w-20 text-right bg-gray-100"
            readOnly
          />
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-700">
              Qribble NFT owned:
            </span>
            <Link
              href={config.QRIBBLE_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-800 underline block"
            >
              Buy
            </Link>
          </div>
          <Input
            type="number"
            value={qribbleNFTsOwned}
            className="w-20 text-right bg-gray-100"
            readOnly
          />
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-700">
              SShift Records owned:
            </span>
            <Link
              href={config.SSHIFT_RECORDS_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-800 underline block"
            >
              Buy
            </Link>
          </div>
          <Input
            type="number"
            value={sshiftRecordsOwned}
            className="w-20 text-right bg-gray-100"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};
