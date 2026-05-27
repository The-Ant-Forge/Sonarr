import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Store } from 'redux';
import Page from 'Components/Page/Page';
import ApplyTheme from './ApplyTheme';
import { appRouteElements } from './AppRoutes';
import { queryClient } from './queryClient';

interface AppProps {
  store: Store;
}

function PageLayout() {
  return (
    <>
      <ApplyTheme />
      <Page>
        <Outlet />
      </Page>
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<PageLayout />}>{appRouteElements()}</Route>
  ),
  { basename: window.Sonarr.urlBase || undefined }
);

function App({ store }: AppProps) {
  useEffect(() => {
    document.title = window.Sonarr.instanceName;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
