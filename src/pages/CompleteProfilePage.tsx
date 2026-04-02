import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CompleteProfileForm } from "@/components/profile/CompleteProfileForm";
import { PasswordSetupStep } from "@/components/profile/PasswordSetupStep";

export default function CompleteProfilePage() {
  const [searchParams] = useSearchParams();
  const skalSettePassord = searchParams.get("sett-passord") === "1";
  const [passordSatt, setPassordSatt] = useState(false);
  const visPassordSteg = skalSettePassord && !passordSatt;

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
            <PasswordSetupStep onSuccess={() => setPassordSatt(true)} />
          ) : (
            <CompleteProfileForm />
          )}
        </div>
      </div>
    </>
  );
}
