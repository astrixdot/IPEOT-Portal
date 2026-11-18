import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorText } from "../api";
import { useSession } from "../auth";
import { Banner, btn, field } from "../ui";

export function LoginPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const config = useQuery({
    queryKey: ["auth-config"],
    queryFn: () => api<{ ldap: boolean; devHint: { cpf: string; password: string } | null }>("/api/auth/config"),
  });
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (session.data?.user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ cpf, password }) });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hidden flex-col justify-between px-16 py-14 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-[11px] font-semibold tracking-wide text-paper">IP</span>
          <span className="text-sm font-medium">ONGC · IPEOT</span>
        </div>
        <div>
          <p className="text-sm text-mute">Institute of Petroleum Engineering and Offshore Technology</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight">Every study, from the annual plan to the signed report.</h1>
        </div>
        <p className="text-xs text-mute">Internal use</p>
      </section>
      <section className="flex items-center justify-center bg-paper px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <p className="text-xs font-medium tracking-[0.16em] text-mute uppercase lg:hidden">ONGC · IPEOT</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Sign in</h2>
          <p className="mt-2 text-sm text-mute">Use your CPF and password.</p>
          {error ? <div className="mt-4"><Banner>{error}</Banner></div> : null}
          <label className="mt-8 block text-sm font-medium text-ink" htmlFor="cpf">CPF</label>
          <input id="cpf" className={`${field} mt-1.5`} autoComplete="username" value={cpf} onChange={(e) => setCpf(e.target.value)} required />
          <label className="mt-4 block text-sm font-medium text-ink" htmlFor="password">Password</label>
          <input id="password" type="password" className={`${field} mt-1.5`} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className={`${btn} mt-8 w-full justify-center`} type="submit" disabled={pending || session.isLoading}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
          {config.data?.devHint ? (
            <p className="mt-5 text-xs leading-5 text-mute">
              Development seed: CPF {config.data.devHint.cpf}, password {config.data.devHint.password}. Other seed CPFs run from 100002 to 100009.
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
