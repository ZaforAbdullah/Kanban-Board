import type { AppProps } from 'next/app';
import { ApolloProvider } from '@apollo/client';
import { PrimeReactProvider } from 'primereact/api';

// PrimeReact core styles
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

// Application styles (includes theme variables + PrimeReact theme overrides)
import '@/styles/globals.css';

import { apolloClient } from '@/lib/apollo';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <PrimeReactProvider>
        <ThemeProvider>
          <AuthProvider>
            <Component {...pageProps} />
          </AuthProvider>
        </ThemeProvider>
      </PrimeReactProvider>
    </ApolloProvider>
  );
}
