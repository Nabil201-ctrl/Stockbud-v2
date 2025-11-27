import AdminComponent from '../../components/Admin';
import { useAuthProtection } from '../../hooks/useAuthProtection';

const AdminDashboard = () => {
  useAuthProtection(true); // Protect this page, only for admins

  return <AdminComponent />;
};

export default AdminDashboard;