import { createContext, useContext, useState, ReactNode } from 'react';
import { InviteEmailGenerator } from '@/components/InviteEmailGenerator';

interface EmailGeneratorData {
  recipientEmail?: string;
  recipientName?: string;
  inviteLink?: string;
  carName?: string;
}

interface EmailGeneratorContextType {
  openEmailGenerator: (data: EmailGeneratorData) => void;
}

const EmailGeneratorContext = createContext<EmailGeneratorContextType | undefined>(undefined);

export function EmailGeneratorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailData, setEmailData] = useState<EmailGeneratorData>({});

  const openEmailGenerator = (data: EmailGeneratorData) => {
    setEmailData(data);
    setIsOpen(true);
  };

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
