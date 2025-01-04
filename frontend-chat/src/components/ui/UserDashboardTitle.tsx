import React from 'react';
import { silkscreen } from '../../../app/fonts';

const UserDashboardTitle: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white bg-opacity-90 
                    rounded-xl shadow-lg border border-gray-300
                    p-3 sm:p-4 md:p-6 lg:p-8 mb-4 md:mb-6 lg:mb-8
                    transform transition-all duration-300 hover:shadow-xl">
      <h1 className={`
        ${silkscreen.className}
        text-xl sm:text-2xl md:text-3xl lg:text-4xl
        text-gray-800 text-center
        tracking-wide
        py-1 sm:py-2 md:py-3
        animate-fade-in
      `}>
        USER DASHBOARD
      </h1>
      <div className="w-16 h-1 bg-indigo-500 mx-auto mt-2 md:mt-3 
                      rounded-full transform transition-all duration-300 
                      hover:w-24 hover:bg-indigo-600" />
    </div>
  );
};

export default UserDashboardTitle;
