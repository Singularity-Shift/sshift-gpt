'use client';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { useAppManagment } from '../../src/context/AppManagment';
import { ChangeAdmin } from './changeAdmin';
import { Fees } from './fees';
import { Subscription } from './subscription';
import { silkscreen } from '../fonts';
import { Features } from './features';

const AdminPage = () => {
  const { isAdmin, isPendingAdmin } = useAppManagment();

  return (
    <div>
      <AGIThoughtBackground />
      <DashboardHeader />

      {/* Title Section */}
      <div className="flex flex-col items-center mt-8">
        <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-lg border border-gray-300 mb-8">
          <h1
            className={`${silkscreen.className} text-4xl text-gray-800 text-center`}
          >
            ADMIN DASHBOARD
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4">
        {(isPendingAdmin || isAdmin) && (
          <div className="flex justify-center mb-8">
            <div className="w-[500px] bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  New Admin Selection
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Set the new admin address
                </p>
                <ChangeAdmin />
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Subscription Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 min-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Subscription Settings
                </h2>
              </div>
              <Subscription />
            </div>

            {/* Fees Management Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 min-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Fees Management
                </h2>
              </div>
              <Fees />
            </div>
            {/* Features Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 min-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Features Config
                </h2>
              </div>
              <Features />
            </div>
          </div>
        )}

        {!isAdmin && !isPendingAdmin && (
          <div className="flex justify-center">
            <div className="w-[500px] bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Unauthorized Access
                </h2>
                <p className="mt-4 text-gray-600">
                  You do not have permission to view this page.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
