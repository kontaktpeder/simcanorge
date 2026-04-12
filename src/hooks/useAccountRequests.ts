import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AccountRequestType = 'anonymize' | 'delete_account';
export type AccountRequestStatus = 'new' | 'in_progress' | 'done';

export interface AccountRequest {
  id: string;
  user_id: string;
  type: AccountRequestType;
  message: string | null;
  status: AccountRequestStatus;
  admin_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useAccountRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ["account-requests", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("account_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AccountRequest[];
    },
    enabled: !!userId,
  });
}

export function useCreateAccountRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      type, 
      message 
    }: { 
      userId: string; 
      type: AccountRequestType; 
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from("account_requests")
        .insert({
          user_id: userId,
          type,
          message: message || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["account-requests", variables.userId] });
      toast.success("Forespørsel sendt til Bilgarasje.no. Du vil bli kontaktet på e-post.");
    },
    onError: (error) => {
      console.error("Error creating account request:", error);
      toast.error("Kunne ikke sende forespørsel. Prøv igjen.");
    },
  });
}

// Admin hook for viewing all requests
export function useAllAccountRequests() {
  return useQuery({
    queryKey: ["all-account-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AccountRequest[];
    },
  });
}

export function useUpdateAccountRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      admin_note,
      resolved_by
    }: { 
      id: string; 
      status: AccountRequestStatus;
      admin_note?: string;
      resolved_by?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (admin_note !== undefined) updateData.admin_note = admin_note;
      if (resolved_by) {
        updateData.resolved_by = resolved_by;
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("account_requests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-account-requests"] });
      toast.success("Forespørsel oppdatert");
    },
    onError: (error) => {
      console.error("Error updating account request:", error);
      toast.error("Kunne ikke oppdatere forespørsel");
    },
  });
}
