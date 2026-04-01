import { Helmet } from "react-helmet-async";
import { CompleteProfileForm } from "@/components/profile/CompleteProfileForm";

export default function CompleteProfilePage() {
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
              Sett opp profilen din for å komme i gang.
            </p>
          </div>
          <CompleteProfileForm />
        </div>
      </div>
    </>
  );
}
