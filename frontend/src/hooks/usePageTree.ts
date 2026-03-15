import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PageTreeNode } from '@/types/cms';

export function usePageTree() {
  return useQuery<PageTreeNode[]>({
    queryKey: ['pageTree'],
    queryFn: async () => {
      const res = await api.get('/api/pages', { params: { view: 'tree' } });
      return res.data;
    },
  });
}
