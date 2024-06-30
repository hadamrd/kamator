import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { boot } from 'quasar/wrappers';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
      cacheTime: 1000 * 60 * 10, // Inactive data remains in cache for 10 minutes
      refetchOnWindowFocus: false, // Do not refetch on window focus
      refetchOnReconnect: false, // Do not refetch on reconnect
      refetchOnMount: false, // Disable refetching when component mounts
      refetchInterval: false, // Disable periodic refetching
    },
  },
});

export default boot(({ app }) => {
  app.use(VueQueryPlugin, { queryClient });
});
