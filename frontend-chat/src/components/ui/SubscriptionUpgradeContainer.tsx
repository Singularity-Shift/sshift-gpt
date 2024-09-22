import React from 'react';

interface SubscriptionUpgradeContainerProps {}

export const SubscriptionUpgradeContainer: React.FC<SubscriptionUpgradeContainerProps> = () => {
  return (
    <div className="w-[400px] bg-white bg-opacity-90 p-10 rounded-xl shadow-lg border border-gray-300">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Upgrade Subscription
        </h2>
        <p className="mt-2 text-sm text-gray-600">&nbsp;</p>
      </div>
      <div className="mt-8 flex items-center justify-center h-40">
        <p className="text-lg text-gray-400 text-center">
          Coming soon - under development
        </p>
      </div>
    </div>
  );
};
