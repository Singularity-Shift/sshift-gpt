import React from 'react';
import { silkscreen } from '../../../app/fonts';

const UserDashboardTitle: React.FC = () => {
  return (
    <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-lg border border-gray-300 mb-8">
      <h1 className={`${silkscreen.className} text-4xl text-gray-800 text-center`}>
        USER DASHBOARD
      </h1>
    </div>
  );
};

export default UserDashboardTitle;