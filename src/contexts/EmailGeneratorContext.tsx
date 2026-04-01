import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { InviteEmailGenerator } from '@/components/InviteEmailGenerator';
import { supabase } from '@/integrations/supabase/client';

interface EmailGeneratorData {
  recipientEmail?: string;
  recipientName?: string;
  inviteLink?: string;
  carName?: string;
  mode?: 'car' | 'access';
  invitationId?: string;
  onSaved?: () => void;
}

interface EmailGeneratorContextType {
  openEmailGenerator: (data: EmailGeneratorData) => void;
}

const EmailGeneratorContext = createContext<EmailGeneratorContextType | undefined>(undefined);

export function EmailGeneratorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailData, setEmailData] = useState<EmailGeneratorData>({});
  const onSavedRef = useRef<(() => void) | undefined>(undefined);

  const openEmailGenerator = (data: EmailGeneratorData) => {
    setEmailData(data);
    onSavedRef.current = data.onSaved;
    setIsOpen(true);
  };

  const handleEmailSent = useCallback(async (sender: 'peder' | 'peter', senderNote: string) => {
    if (!emailData.invitationId) return;
    
    // Update invitation with sent_by and sender_note
    const { error } = await supabase
      .from('car_invitations')
      .update({ 
        sent_by: sender,
        sender_note: senderNote || null
      })
      .eq('id', emailData.invitationId);

    if (!error && onSavedRef.current) {
      onSavedRef.current();
    }
  }, [emailData.invitationId]);

  return (
    <EmailGeneratorContext.Provider value={{ openEmailGenerator }}>
      {children}
      <InviteEmailGenerator
        open={isOpen}
        onOpenChange={setIsOpen}
        recipientEmail={emailData.recipientEmail || ''}
        recipientName={emailData.recipientName || ''}
        inviteLink={emailData.inviteLink || ''}
        carName={emailData.carName || ''}
        onEmailSent={handleEmailSent}
      />
    </EmailGeneratorContext.Provider>
  );
}

export function useEmailGenerator() {
  const context = useContext(EmailGeneratorContext);
  if (!context) {
    throw new Error('useEmailGenerator must be used within EmailGeneratorProvider');
  }
  return context;
}
