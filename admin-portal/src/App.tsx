import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { DesignSystemProvider } from './design-system';
import { AdminLayout } from './layout/AdminLayout';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditPage } from './pages/AuditPage';
import { DashboardPage } from './pages/DashboardPage';
import { JourneysPage } from './pages/JourneysPage';
import { UsersPage } from './pages/UsersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function RootProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <DesignSystemProvider>
        <Outlet />
      </DesignSystemProvider>
    </QueryClientProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootProviders />,
    children: [
      {
        path: '/',
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'journeys', element: <JourneysPage /> },
          { path: 'audit', element: <AuditPage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
