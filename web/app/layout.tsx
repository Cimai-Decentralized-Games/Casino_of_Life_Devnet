import './global.css';
import { UiLayout } from '@/components/ui/ui-layout';
import { SolanaProvider } from '@/components/solana/solana-provider';
import { ReactQueryProvider } from './react-query-provider';
import ErrorBoundary from '@/components/errorBoundary/errorBoundary';

export const metadata = {
  title: 'casino-of-life',
  description: 'Sol for Freedumbs',
};

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/'},
  { label: 'Education', path: '/education-portal'},
  { label: 'Casino', path: '/betting-dashboard' },
  { label: 'Dashboard', path: '/game-agent' },
  { label: 'Registry', path: '/registry'},
  { label: 'Chat', path: '/educhatbox'},
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ReactQueryProvider>   
            <SolanaProvider>
              <UiLayout links={links}>
                {children}
              </UiLayout>
            </SolanaProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}