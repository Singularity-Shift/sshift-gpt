'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { silkscreen } from '../fonts';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { SubscriptionContainer } from '../../src/components/ui/SubscriptionContainer';
import { UserProfileContainer } from '../../src/components/ui/UserProfileContainer';
import { SubscriptionUpgradeContainer } from '../../src/components/ui/SubscriptionUpgradeContainer';
import { Button } from '../../src/components/ui/button';
import { useAppManagment } from '../../src/context/AppManagment';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col relative">
      <AGIThoughtBackground />
      <DashboardHeader />

      <main className="flex-grow flex flex-col items-center">
        {/* Dashboard Title */}
        <div className="bg-white rounded-xl shadow-md px-8 py-4 mb-6">
          <h1 className={`${silkscreen.className} text-2xl`}>
            USER DASHBOARD
          </h1>
        </div>

        {/* Cards Container - Grid for desktop, Stack for mobile */}
        <div className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <SubscriptionContainer />
          <UserProfileContainer />
          <SubscriptionUpgradeContainer />
        </div>

        {/* Enter Button */}
        <Button
          onClick={() => router.push('/chat')}
          className={`
            ${silkscreen.className}
            px-8
            py-2
            text-black
            bg-green-400
            hover:bg-green-500
            rounded-full
            font-medium
            transition-colors
            shadow-md
          `}
        >
          Enter SShift GPT
        </Button>
      </main>
    </div>
  );
}
