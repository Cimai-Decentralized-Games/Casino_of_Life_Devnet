'use client';

import dynamic from 'next/dynamic';

// Disable SSR for the entire dashboard
const BettingDashboard = dynamic(
  () => import('@/components/betting/betting-dashboard').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="container-fluid">
        <div className="betting-dashboard min-h-screen bg-base-200 text-base-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">Loading Dashboard...</h1>
            </div>
          </div>
        </div>
      </div>
    )
  }
);

export default function Page() {
  return <BettingDashboard />;
}