import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(6, "Passord må være minst 6 tegn"),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, isAdmin, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in as admin
  if (user && isAdmin) {
    navigate("/admin/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate input
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Ugyldig e-post eller passord");
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Check will happen via auth state change, redirect handled there
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Noe gikk galt");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <section className="poster-section poster-section-blue min-h-[30vh] flex items-center">
        <div className="container mx-auto text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="headline-lg">ADMIN</h1>
          <p className="text-xl opacity-90">Logg inn for å administrere innhold</p>
        </div>
      </section>

      <section className="poster-section">
        <div className="container mx-auto max-w-md">
          <form onSubmit={handleSubmit} className="retro-card">
            {error && (
              <div className="flex items-center gap-2 bg-accent/10 border-2 border-accent text-accent p-4 mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block font-display text-lg mb-2">
                E-POST
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-10 border-2 border-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-display text-lg mb-2">
                PASSORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 border-2 border-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-retro w-full disabled:opacity-50"
            >
              {isLoading ? "Logger inn..." : "Logg inn"}
            </button>
          </form>

          <p className="text-center text-muted-foreground mt-6 text-sm">
            Kun for administratorer. Trenger du tilgang?{" "}
            <a href="mailto:kontaktpeder@gmail.com" className="text-primary hover:underline">
              Ta kontakt
            </a>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AdminLogin;
