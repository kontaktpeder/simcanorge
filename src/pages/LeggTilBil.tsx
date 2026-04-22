import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";

export default function LeggTilBil() {
  const [target, setTarget] = useState<"/dashboard/opprett-bil" | "/send-inn" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setTarget(data.session?.user ? "/dashboard/opprett-bil" : "/send-inn");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!target) {
    return (
      <Layout>
        <Helmet>
          <title>Legg inn bilen din – Bilgarasje.no</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#34eab8]" />
        </div>
      </Layout>
    );
  }

  return <Navigate to={target} replace />;
}
