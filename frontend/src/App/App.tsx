import { QueryClientProvider } from '@tanstack/react-query';
import { ConnectedRouter, ConnectedRouterProps } from 'connected-react-router';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import Page from 'Components/Page/Page';
import ApplyTheme from './ApplyTheme';
import AppRoutes from './AppRoutes';
import { queryClient } from './queryClient';

interface AppProps {
  store: Store;
  history: ConnectedRouterProps['history'];
}

function App({ store, history }: AppProps) {
  useEffect(() => {
    document.title = window.Sonarr.instanceName;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <ApplyTheme />
          <Page>
            <AppRoutes />
          </Page>
        </ConnectedRouter>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
