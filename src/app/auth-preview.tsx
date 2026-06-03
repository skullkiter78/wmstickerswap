"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type AuthMode = "login" | "register" | "forgot" | "reset";

type AuthPreviewProps = {
  onAuthSuccess: (session: Session) => void;
  isPasswordRecovery?: boolean;
  onPasswordResetSuccess?: () => void;
};

export function AuthPreview({
  onAuthSuccess,
  isPasswordRecovery = false,
  onPasswordResetSuccess,
}: AuthPreviewProps) {
  const [mode, setMode] = useState<AuthMode>(
    isPasswordRecovery ? "reset" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [nickname, setNickname] = useState("");
  const [ort, setOrt] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHighlightedMessage, setIsHighlightedMessage] = useState(false);
  const [message, setMessage] = useState(
    isPasswordRecovery
      ? "Gib jetzt dein neues Passwort ein."
      : "Melde dich an oder erstelle dir ein Konto für die Tauschbörse.",
  );

  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot";
  const isResetPassword = mode === "reset";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setIsHighlightedMessage(false);
    setMessage(
      nextMode === "register"
        ? "Erstelle dein Konto. Wir speichern nur, was für die Tauschbörse nötig ist."
        : nextMode === "forgot"
          ? "Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen."
          : "Melde dich mit deinem bestehenden Konto an.",
    );
  }

  async function handleSubmit() {
    setIsHighlightedMessage(false);

    if (isForgotPassword) {
      if (!email) {
        setMessage("Bitte gib deine E-Mail-Adresse ein.");
        return;
      }

      setIsLoading(true);
      setMessage("Reset-Link wird verschickt...");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsHighlightedMessage(true);
      setMessage(
        "Wenn die E-Mail bei uns registriert ist, bekommst du jetzt einen Link zum Zurücksetzen. Die Mail kommt von Supabase.",
      );
      setIsLoading(false);
      return;
    }

    if (isResetPassword) {
      if (!password || !passwordConfirmation) {
        setMessage("Bitte gib dein neues Passwort zweimal ein.");
        return;
      }

      if (password !== passwordConfirmation) {
        setMessage("Die beiden Passwörter stimmen noch nicht überein.");
        return;
      }

      setIsLoading(true);
      setMessage("Passwort wird geändert...");

      const { data, error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      setPassword("");
      setPasswordConfirmation("");
      setIsHighlightedMessage(true);
      setMessage("Passwort geändert. Du bist eingeloggt.");
      setIsLoading(false);
      onPasswordResetSuccess?.();

      if (data.user) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          onAuthSuccess(sessionData.session);
        }
      }
      return;
    }

    if (!email || !password) {
      setMessage("Bitte gib E-Mail und Passwort ein.");
      return;
    }

    if (isRegister && password !== passwordConfirmation) {
      setMessage("Die beiden Passwörter stimmen noch nicht überein.");
      return;
    }

    if (isRegister && (!nickname || !ort)) {
      setMessage("Bitte gib für die Registrierung Nickname und Wohnort ein.");
      return;
    }

    if (isRegister && !privacyAccepted) {
      setMessage("Bitte bestätige zuerst den Datenschutz-Hinweis.");
      return;
    }

    setIsLoading(true);
    setMessage(isRegister ? "Konto wird erstellt..." : "Login läuft...");

    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            nickname,
            ort,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        onAuthSuccess(data.session);
        setMessage("Konto erstellt. Du bist eingeloggt.");
        setIsLoading(false);
        return;
      }

      setIsHighlightedMessage(true);
      setPassword("");
      setPasswordConfirmation("");
      setMessage(
        data.user
          ? "Konto erstellt. Bitte bestätige jetzt deine E-Mail-Adresse, bevor du dich einloggst."
          : "Registrierung abgeschickt. Bitte prüfe dein Postfach.",
      );
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    if (data.session) {
      onAuthSuccess(data.session);
    }

    setMessage("Du bist eingeloggt.");
    setIsLoading(false);
  }

  return (
    <form
      id="anmelden"
      className="rounded-lg bg-white p-5 shadow-xl ring-1 ring-[#dbe7ff] sm:p-6"
    >
      <p className="font-display text-4xl leading-none tracking-normal text-[#132a74]">
        Rein ins Album
      </p>
      <p
        className={`mt-2 min-h-12 rounded-lg text-sm leading-6 ${
          isHighlightedMessage
            ? "bg-[#e9f8ee] p-3 font-bold text-[#17603a] ring-1 ring-[#bfe6cc]"
            : "text-[#5d6b86]"
        }`}
        aria-live="polite"
      >
        {message}
      </p>

      {!isResetPassword ? (
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-[#eef5ff] p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`h-12 rounded-md text-sm font-black ${
              !isRegister && !isForgotPassword
                ? "bg-white text-[#132a74] shadow-sm"
                : "text-[#5d6b86]"
            }`}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`h-12 rounded-md text-sm font-black ${
              isRegister
                ? "bg-white text-[#132a74] shadow-sm"
                : "text-[#5d6b86]"
            }`}
          >
            Registrieren
          </button>
        </div>
      ) : null}

      {isRegister ? (
        <>
          <label className="mt-5 block text-sm font-bold" htmlFor="nickname">
            Nickname
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="z. B. StickerBen"
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
          />
          <label className="mt-4 block text-sm font-bold" htmlFor="ort">
            Wohnort
          </label>
          <input
            id="ort"
            type="text"
            value={ort}
            onChange={(event) => setOrt(event.target.value)}
            placeholder="z. B. Fröndenberg-Frömern"
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
          />
        </>
      ) : null}

      {!isResetPassword ? (
        <>
          <label className="mt-5 block text-sm font-bold" htmlFor="email">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="du@example.de"
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
          />
        </>
      ) : null}

      {!isForgotPassword ? (
        <>
          <label className="mt-4 block text-sm font-bold" htmlFor="password">
            {isResetPassword ? "Neues Passwort" : "Passwort"}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mindestens 6 Zeichen"
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
          />
        </>
      ) : null}

      {isRegister || isResetPassword ? (
        <>
          <label
            className="mt-4 block text-sm font-bold"
            htmlFor="password-confirmation"
          >
            {isResetPassword
              ? "Neues Passwort wiederholen"
              : "Passwort wiederholen"}
          </label>
          <input
            id="password-confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            placeholder="Noch einmal eingeben"
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
          />
        </>
      ) : null}

      {isRegister ? (
        <>
          <div className="mt-4 rounded-lg bg-[#fff8df] p-3 text-sm leading-6 text-[#6d5214] ring-1 ring-[#f1d982]">
            Nach der Registrierung kommt eine Bestätigungsmail von Supabase.
            Supabase ist unser Login-Dienst für WM Sticker Swap; der Link in
            der Mail aktiviert dein Konto.
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-lg bg-[#f7fbff] p-3 text-sm leading-6 text-[#33415c] ring-1 ring-[#dbe7ff]">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.target.checked)}
              className="mt-1 size-5 accent-[#132a74]"
            />
            <span>
              Ich habe den{" "}
              <Link
                href="/datenschutz"
                className="font-black text-[#132a74] underline"
              >
                Datenschutz-Hinweis
              </Link>{" "}
              gelesen.
            </span>
          </label>
        </>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="mt-5 h-14 w-full rounded-lg bg-[#e44533] px-5 text-base font-black text-white shadow-sm disabled:opacity-70"
      >
        {isLoading
          ? "Bitte warten..."
          : isRegister
            ? "Konto erstellen"
            : isForgotPassword
              ? "Reset-Link senden"
              : isResetPassword
                ? "Passwort ändern"
                : "Einloggen"}
      </button>

      {!isResetPassword ? (
        <>
          <button
            type="button"
            onClick={() => switchMode(isRegister ? "login" : "register")}
            className="mt-3 h-14 w-full rounded-lg border-2 border-[#132a74] px-5 text-base font-black text-[#132a74]"
          >
            {isRegister
              ? "Ich habe schon ein Konto"
              : "Neues Konto registrieren"}
          </button>

          {!isRegister ? (
            <button
              type="button"
              onClick={() => switchMode(isForgotPassword ? "login" : "forgot")}
              className="mt-3 w-full text-sm font-black text-[#132a74] underline-offset-4 hover:underline"
            >
              {isForgotPassword
                ? "Zurück zum Login"
                : "Passwort vergessen?"}
            </button>
          ) : null}
        </>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-[#66728a]">
        Wir nutzen deine Daten nur für diese Sticker-Tauschbörse. Keine
        Weitergabe an Dritte zu Werbezwecken.
      </p>
    </form>
  );
}
