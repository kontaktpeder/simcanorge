import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRequestSellerApproval() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('request_seller_approval' as any);
      if (error) throw error;
      return data as { success: boolean; message?: string; notified_count?: number };
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast({
          title: 'Forespørsel sendt',
          description: 'Admin er varslet. Du hører fra oss når profilen er vurdert.',
        });
      } else {
        toast({
          title: 'Kunne ikke sende',
          description: data?.message || 'Prøv igjen senere.',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Noe gikk galt',
        description: 'Kunne ikke sende forespørsel om godkjenning.',
        variant: 'destructive',
      });
    },
  });
}
