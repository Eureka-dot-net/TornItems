import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './app/router/routes';
import { ThemeProvider } from '@emotion/react';
import { appTheme } from './app/themes/appTheme';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <ThemeProvider theme={appTheme}>
        <AppRouter />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
