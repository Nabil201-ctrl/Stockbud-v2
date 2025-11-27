import AdminComponent from '../../src/components/Admin';
import { useAuthProtection } from '../../src/hooks/useAuthProtection';

export default function AdminDashboard() {
  useAuthProtection(true);

  return <AdminComponent />;
}