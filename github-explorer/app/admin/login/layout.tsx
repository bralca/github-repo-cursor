import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login | GitHub Explorer',
  description: 'Sign in to access the GitHub Explorer admin dashboard',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 