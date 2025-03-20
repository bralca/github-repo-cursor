import { ReactNode } from 'react';
import { AdminEventProvider } from '@/components/admin/AdminEventContext';

export const metadata = {
  title: 'Admin Dashboard | GitHub Explorer',
  description: 'Administrative dashboard for GitHub Explorer.',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminEventProvider>
      {children}
    </AdminEventProvider>
  );
} 