import React from 'react';
import { SshiftWalletDisconnect } from '../SshigtWallet';

const UserLoginStatus: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
      <span className="text-gray-800 font-semibold">Connected</span>
      <SshiftWalletDisconnect />
    </div>
  );
};

export default UserLoginStatus;
