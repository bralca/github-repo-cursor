import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | GitHub Explorer',
  description: 'Manage pipeline operations and monitor system status',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
} 