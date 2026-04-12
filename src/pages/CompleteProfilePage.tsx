import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CompleteProfileForm } from "@/components/profile/CompleteProfileForm";
import { PasswordSetupStep } from "@/components/profile/PasswordSetupStep";
import { safeInternalPath } from "@/lib/navigation";

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skalSettePassord = searchParams.get("sett-passord") === "1";
  const returnUrlRaw = searchParams.get("returnUrl");
  const hasCarReturn =
    skalSettePassord && returnUrlRaw && returnUrlRaw.includes("/bil");

  const [passordSatt, setPassordSatt] = useState(false);
  const visPassordSteg = skalSettePassord && !passordSatt;

  const handlePasswordSuccess = () => {
    if (hasCarReturn) {
      const path = safeInternalPath(returnUrlRaw, "/dashboard");
      navigate(path, { replace: true });
      return;
    }
    setPassordSatt(true);
  };

  return (
    <>
      <Helmet>
        <title>Fullfør profilen din | Bilgarasjen</title>
      </Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Velkommen til Bilgarasjen</h1>
            <p className="text-muted-foreground">
              {visPassordSteg
                ? "Velg et passord for kontoen din."
                : "Sett opp profilen din for å komme i gang."}
            </p>
          </div>
          {visPassordSteg ? (
            <PasswordSetupStep onSuccess={handlePasswordSuccess} />
          ) : (
            <CompleteProfileForm />
          )}
        </div>
      </div>
    </>
  );
}
