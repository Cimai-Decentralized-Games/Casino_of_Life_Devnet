import './global.css';
import '../config/appkit-config';
import { UiLayout } from '@/components/ui/ui-layout';
import { SolanaProvider } from '@/components/solana/solana-provider';
import { ReactQueryProvider } from './react-query-provider';

export const metadata = {
  title: 'casino-of-life',
  description: 'Sol for Freedumbs',
};

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/'},
  { label: 'Get Retarded', path: '/retarded-portal'},
  { label: 'Casino', path: '/betting-dashboard' },
  { label: 'Marketplace', path: '/marketplace' },
  { label: 'Caballo Loko', path: '/caballoloko'},
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
          <ReactQueryProvider>   
            <SolanaProvider>
              <UiLayout links={links}>
                {children}
              </UiLayout>
            </SolanaProvider>
          </ReactQueryProvider>
      </body>
    </html>
  );
}