import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';

export const useAuthProtection = (adminOnly: boolean = false) => {
  const { isAuthenticated, isAdmin } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login');
    } else if (adminOnly && !isAdmin) {
      router.replace('/unauthorized');
    }
  }, [isAuthenticated, isAdmin, adminOnly, router]);

  return { isAuthenticated, isAdmin };
};