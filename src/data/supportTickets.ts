import { supabase } from '@/integrations/supabase/client';
import { supportLogger } from '@/lib/supportLogger';

export type SupportTicketType = 'bug' | 'suggestion' | 'content' | 'other';
export type SupportTicketSeverity = 'low' | 'medium' | 'high';
export type SupportTicketStatus = 'new' | 'seen' | 'in_progress' | 'resolved' | 'not_a_bug';

export interface SupportTicket {
  id: string;
  created_at: string;
  user_id: string | null;
  status: SupportTicketStatus;
  type: SupportTicketType;
  severity: SupportTicketSeverity;
  action_text: string | null;
  result_text: string | null;
  page: string | null;
  screenshot_url: string | null;
  debug_payload: unknown | null;
  admin_notes: string | null;
  app_version: string | null;
}

export interface CreateSupportTicketInput {
  type: SupportTicketType;
  severity: SupportTicketSeverity;
  action_text: string;
  result_text: string;
  screenshot?: File;
  includeDebugInfo: boolean;
  userId?: string;
}

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<{ data: SupportTicket | null; error: Error | null }> {
  try {
    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();
    const userId = input.userId || user?.id || null;

    const debugPayload = input.includeDebugInfo 
      ? supportLogger.getDebugPayload(userId || undefined) 
      : null;

    const insertData = {
      user_id: userId,
      type: input.type,
      severity: input.severity,
      action_text: input.action_text,
      result_text: input.result_text,
      page: window.location.href,
      debug_payload: debugPayload,
      app_version: '1.0.0',
    };

    // Get user's access token if logged in, otherwise use anon key
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    // For anon users, we must use the anon key as both apikey AND Authorization
    const authToken = accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    // Use REST API directly to bypass type checking for new table
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/support_tickets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${authToken}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(insertData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Insert error:', errorData);
      return { data: null, error: new Error(errorData.message || `HTTP ${response.status}`) };
    }

    const tickets = await response.json();
    const ticket = Array.isArray(tickets) ? tickets[0] : tickets;

    if (!ticket) {
      return { data: null, error: new Error('Failed to create ticket') };
    }

    // Upload screenshot if provided (non-blocking)
    if (input.screenshot && ticket.id) {
      try {
        const timestamp = Date.now();
        const fileExt = input.screenshot.name.split('.').pop();
        const fileName = `${ticket.id}_${timestamp}.${fileExt}`;
        const filePath = `screenshots/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('support-screenshots')
          .upload(filePath, input.screenshot);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('support-screenshots')
            .getPublicUrl(filePath);

          // Update ticket with screenshot URL
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/support_tickets?id=eq.${ticket.id}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({ screenshot_url: urlData.publicUrl }),
            }
          );
        }
      } catch (uploadError) {
        console.error('Screenshot upload failed:', uploadError);
      }
    }

    return { data: ticket as SupportTicket, error: null };
  } catch (error) {
    console.error('Create ticket error:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

export async function getSupportTickets(filters?: {
  status?: SupportTicketStatus;
  severity?: SupportTicketSeverity;
  days?: number;
}): Promise<{ data: SupportTicket[] | null; error: Error | null }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    let url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/support_tickets?select=*&order=created_at.desc`;

    if (filters?.status) {
      url += `&status=eq.${filters.status}`;
    }

    if (filters?.severity) {
      url += `&severity=eq.${filters.severity}`;
    }

    if (filters?.days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.days);
      url += `&created_at=gte.${cutoffDate.toISOString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Fetch tickets error:', errorData);
      return { data: null, error: new Error('Failed to fetch tickets') };
    }

    const data = await response.json();
    return { data: data as SupportTicket[], error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

export async function updateSupportTicket(
  id: string,
  updates: {
    status?: SupportTicketStatus;
    admin_notes?: string;
  }
): Promise<{ data: SupportTicket | null; error: Error | null }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/support_tickets?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      return { data: null, error: new Error('Failed to update ticket') };
    }

    const [data] = await response.json();
    return { data: data as SupportTicket, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

export async function getSupportTicketStats(): Promise<{
  total: number;
  new: number;
  high: number;
  recent: number;
} | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const headers = {
      'apikey': apikey,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'count=exact',
    };

    const [totalRes, newRes, highRes, recentRes] = await Promise.all([
      fetch(`${baseUrl}/rest/v1/support_tickets?select=id`, { headers, method: 'HEAD' }),
      fetch(`${baseUrl}/rest/v1/support_tickets?select=id&status=eq.new`, { headers, method: 'HEAD' }),
      fetch(`${baseUrl}/rest/v1/support_tickets?select=id&severity=eq.high`, { headers, method: 'HEAD' }),
      fetch(`${baseUrl}/rest/v1/support_tickets?select=id&created_at=gte.${sevenDaysAgo.toISOString()}`, { headers, method: 'HEAD' }),
    ]);

    const parseCount = (res: Response) => {
      const range = res.headers.get('content-range');
      if (!range) return 0;
      const parts = range.split('/');
      return parseInt(parts[1] || '0', 10);
    };

    return {
      total: parseCount(totalRes),
      new: parseCount(newRes),
      high: parseCount(highRes),
      recent: parseCount(recentRes),
    };
  } catch {
    return null;
  }
}
