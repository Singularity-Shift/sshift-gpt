import { useAppManagment } from '../../src/context/AppManagment';
import { Fees } from './fees';

const AdminPage = () => {
  const { isAdmin } = useAppManagment();

  return (
    <div>
      {isAdmin ? (
        <div>
          <h1>Admin dashboard</h1>

          <h2>Fees Managment</h2>
          <Fees />
        </div>
      ) : (
        <div>
          <h1>Unauthorized access</h1>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
