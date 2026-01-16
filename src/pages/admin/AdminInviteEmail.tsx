import { AdminLayout } from '@/components/admin/AdminLayout';
import { InviteEmailGenerator } from '@/components/InviteEmailGenerator';
import { useState } from 'react';

export default function AdminInviteEmail() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AdminLayout title="E-postgenerator">
      <div className="flex items-center justify-center min-h-[50vh]">
        <InviteEmailGenerator
          open={isOpen}
          onOpenChange={setIsOpen}
          recipientEmail=""
          recipientName=""
          inviteLink=""
          carName=""
        />
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="text-primary underline"
          >
            Åpne e-postgenerator
          </button>
        )}
      </div>
    </AdminLayout>
  );
}
