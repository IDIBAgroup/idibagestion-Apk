import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useNavigate } from "@/lib/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { ArrowRight, KeyRound, LockKeyhole, Mail, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";

const subscribeToLocation = () => () => {};
const locationSnapshot = () => window.location.search;
const serverLocationSnapshot = () => "";
const oauthMessages: Record<string, string> = {
  google_not_configured:
    "La connexion Google n’est pas encore configurée sur ce serveur.",
  google_cancelled: "La connexion Google a été annulée.",
  google_account_conflict:
    "Un compte existe déjà avec cette adresse. Connectez-vous avec votre mot de passe ou contactez l’administrateur.",
  google_failed: "La connexion Google a échoué. Réessayez.",
};

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrorMessage, setError] = useState("");
  const [dismissOAuthError, setDismissOAuthError] = useState(false);
  const search = useSyncExternalStore(
    subscribeToLocation,
    locationSnapshot,
    serverLocationSnapshot
  );
  const oauthCode = new URLSearchParams(search).get("auth");
  const error =
    loginErrorMessage ||
    (!dismissOAuthError && oauthCode ? oauthMessages[oauthCode] || "" : "");
  const utils = trpc.useUtils();
  const returnTo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("returnTo")
      : null;
  const destination =
    returnTo?.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.startsWith("/\\")
      ? returnTo
      : "/dashboard";
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate(destination, { replace: true });
    },
    onError: loginError => {
      const safeError =
        loginError.data?.code === "UNAUTHORIZED" ||
        loginError.data?.code === "TOO_MANY_REQUESTS";
      setError(
        safeError
          ? loginError.message
          : "Connexion indisponible. Vérifiez le service et réessayez."
      );
    },
  });

  useEffect(() => {
    window.localStorage.removeItem("idibages-demo-session");
    void fetch("/api/auth/cleanup-legacy-cookies", {
      credentials: "same-origin",
    }).catch(() => undefined);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDismissOAuthError(true);
    login.mutate({ email, password });
  }

  return (
    <AuthShell
      title="Heureux de vous retrouver."
      subtitle="Connectez-vous à votre espace de gestion IDIBAGES."
      compact
    >
      <form
        className="id-auth-form"
        onSubmit={handleSubmit}
        aria-busy={login.isPending}
      >
        {/* OAuth requires a full browser navigation to the server endpoint. */}
        <div className="id-auth-methods">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/auth/google/start" className="id-auth-google">
            <span aria-hidden="true">G</span> Continuer avec Google
          </a>
          <div className="id-auth-divider">
            <span>ou avec votre e-mail</span>
          </div>
        </div>
        <div className="id-auth-credentials">
          <div className="id-auth-section-heading">
            <span>Vos identifiants</span>
            <span>Champs obligatoires&nbsp;*</span>
          </div>
          <AuthField
            id="login-email"
            name="email"
            label="Adresse e-mail"
            type="email"
            autoComplete="username"
            icon={<Mail size={17} />}
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
            disabled={login.isPending}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
          />
          <AuthField
            id="login-password"
            name="password"
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            icon={<KeyRound size={17} />}
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
            disabled={login.isPending}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
          />
          {error && (
            <p id="login-error" role="alert" className="id-auth-error">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={login.isPending}
          className="id-auth-submit"
        >
          {login.isPending ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Connexion…
            </>
          ) : (
            <>
              Se connecter <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
      <p className="id-auth-note">
        <LockKeyhole size={14} /> Un nouveau compte Google peut ensuite créer
        son espace entreprise.
      </p>
    </AuthShell>
  );
}
