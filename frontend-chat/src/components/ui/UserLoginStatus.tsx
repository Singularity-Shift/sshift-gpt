import React from 'react';
import { SshiftWalletDisconnect } from '../SshigtWallet';
import { Wallet } from 'lucide-react';

const UserLoginStatus: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-blue-500 rounded-full"></div>
      <span className="hidden md:inline text-gray-800 font-semibold">Connected</span>
      <SshiftWalletDisconnect />
    </div>
  );
};

export default UserLoginStatus;
