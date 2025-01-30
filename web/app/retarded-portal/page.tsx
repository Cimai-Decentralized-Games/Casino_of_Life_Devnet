import dynamic from 'next/dynamic';

const RetardDashboard = dynamic(() => import('@/components/retarded-portal/retard-dashboard'), { ssr: false });

export default function RetardedPortalPage() {
  return <RetardDashboard />;
}