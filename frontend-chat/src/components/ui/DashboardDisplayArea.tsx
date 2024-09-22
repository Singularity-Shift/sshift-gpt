import React from 'react';
import { SubscriptionContainer } from './SubscriptionContainer';
import { UserProfileContainer } from './UserProfileContainer';
import { SubscriptionUpgradeContainer } from './SubscriptionUpgradeContainer';
import UserDashboardTitle from './UserDashboardTitle';

interface DashboardDisplayAreaProps {
  days: number;
  setDays: React.Dispatch<React.SetStateAction<number>>;
  price: number;
  dates: { startDate: string; expirationDate: string };
  discount: number;
  isSubscriptionActive: boolean;
  moveBotsOwned: string;
  qribbleNFTsOwned: string;
  sshiftRecordsOwned: string;
}

const DashboardDisplayArea: React.FC<DashboardDisplayAreaProps> = ({
  days,
  setDays,
  price,
  dates,
  discount,
  isSubscriptionActive,
  moveBotsOwned,
  qribbleNFTsOwned,
  sshiftRecordsOwned,
}) => {
  return (
    <div className="flex flex-col items-center">
      <UserDashboardTitle />
      <div className="flex space-x-8 mb-8">
        {/* Subscription Container */}
        <SubscriptionContainer
          days={days}
          setDays={setDays}
          price={price}
          dates={dates}
          discount={discount}
        />

        {/* User Profile Container */}
        <UserProfileContainer
          isSubscriptionActive={isSubscriptionActive}
          moveBotsOwned={moveBotsOwned}
          qribbleNFTsOwned={qribbleNFTsOwned}
          sshiftRecordsOwned={sshiftRecordsOwned}
        />

        {/* Subscription Upgrade Container */}
        <SubscriptionUpgradeContainer />
      </div>
    </div>
  );
};

export default DashboardDisplayArea;