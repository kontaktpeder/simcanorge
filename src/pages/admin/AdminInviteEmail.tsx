import { AdminLayout } from '@/components/admin/AdminLayout';
import { InviteEmailGenerator } from '@/components/InviteEmailGenerator';

export default function AdminInviteEmail() {
  return (
    <AdminLayout title="E-postgenerator">
      <InviteEmailGenerator />
    </AdminLayout>
  );
}
