import dynamic from 'next/dynamic';

const LearnRL = dynamic(() => import('@/components/education-portal/learn-rl-dashboard'), { ssr: false });

export default function EducationPortalPage() {
  return <LearnRL />;
}