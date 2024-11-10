'use client';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { useAppManagment } from '../../src/context/AppManagment';
import { ChangeAdmin } from './changeAdmin';
import { Fees } from './fees';
import { Subscription } from './subscription';

const AdminPage = () => {
  const { isAdmin, isPendingAdmin } = useAppManagment();

  return (
    <div>
      <AGIThoughtBackground />
      <DashboardHeader />
      <div className="m-20">
        {(isPendingAdmin || isAdmin) && (
          <div>
            {isAdmin ? <h1>New admin selection</h1> : <h1>Upgrade to admin</h1>}
            <ChangeAdmin />
          </div>
        )}
        {isAdmin && (
          <div>
            <h1>Admin dashboard</h1>
            <Subscription />
            <h2>Fees Managment</h2>
            <Fees />
          </div>
        )}

        {!isAdmin && !isPendingAdmin && (
          <div>
            <h1>Unauthorized access</h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
