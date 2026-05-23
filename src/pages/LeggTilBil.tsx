import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";

export default function LeggTilBil() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Legg inn bilen din – Bilgarasje.no</title>
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href="https://bilgarasje.no/legg-inn-bil" />
        </Helmet>
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "#070b10" }}
        >
          <Loader2 className="w-6 h-6 animate-spin text-[#34eab8]" />
        </div>
      </>
    );
  }

  return <Navigate to={user ? "/dashboard/opprett-bil" : "/send-inn"} replace />;
}
