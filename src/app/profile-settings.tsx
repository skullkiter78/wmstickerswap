"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProfileSettingsProps = {
  userId: string;
  onAccountDeleted?: () => void;
};

type ProfileForm = {
  nickname: string;
  ort: string;
  kontakt_whatsapp: string;
  kontakt_email: string;
  kontakt_telefon: string;
  email_benachrichtigungen: boolean;
};

const emptyProfile: ProfileForm = {
  nickname: "",
  ort: "",
  kontakt_whatsapp: "",
  kontakt_email: "",
  kontakt_telefon: "",
  email_benachrichtigungen: true,
};

export function ProfileSettings({
  userId,
  onAccountDeleted,
}: ProfileSettingsProps) {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [message, setMessage] = useState("Lade Profil...");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "nickname, ort, kontakt_whatsapp, kontakt_email, kontakt_telefon, email_benachrichtigungen",
        )
        .eq("id", userId)
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setProfile({
        nickname: data.nickname ?? "",
        ort: data.ort ?? "",
        kontakt_whatsapp: data.kontakt_whatsapp ?? "",
        kontakt_email: data.kontakt_email ?? "",
        kontakt_telefon: data.kontakt_telefon ?? "",
        email_benachrichtigungen: data.email_benachrichtigungen ?? true,
      });
      setMessage(
        "Kontaktdaten werden anderen erst angezeigt, wenn ein Treffer besteht.",
      );
    }

    loadProfile();
  }, [userId]);

  async function saveProfile() {
    if (!profile.nickname || !profile.ort) {
      setMessage("Bitte Nickname und Wohnort ausfüllen.");
      return;
    }

    setIsSaving(true);
    setMessage("Profil wird gespeichert...");

    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: profile.nickname,
        ort: profile.ort,
        kontakt_whatsapp: profile.kontakt_whatsapp || null,
        kontakt_email: profile.kontakt_email || null,
        kontakt_telefon: profile.kontakt_telefon || null,
        email_benachrichtigungen: profile.email_benachrichtigungen,
      })
      .eq("id", userId);

    setMessage(error ? error.message : "Profil gespeichert.");
    setIsSaving(false);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "LÖSCHEN") {
      setMessage("Tippe LÖSCHEN ein, wenn du dein Konto wirklich löschen willst.");
      return;
    }

    setIsDeleting(true);
    setMessage("Konto wird gelöscht...");

    const { error } = await supabase.rpc("delete_own_account");

    if (error) {
      setMessage(
        "Konto konnte noch nicht gelöscht werden. Bitte führe die SQL-Datei 05-delete-own-account.sql in Supabase aus.",
      );
      setIsDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    setIsDeleting(false);
    onAccountDeleted?.();
  }

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff]">
      <p className="text-sm font-bold text-[#132a74]">Profil & Kontakt</p>
      <h2 className="mt-1 text-2xl font-black">So erreicht man dich</h2>
      <p className="mt-2 text-sm leading-6 text-[#5d6b86]">{message}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextInput
          label="Nickname"
          value={profile.nickname}
          placeholder="z. B. StickerBen"
          onChange={(value) => setProfile({ ...profile, nickname: value })}
        />
        <TextInput
          label="Wohnort"
          value={profile.ort}
          placeholder="z. B. Fröndenberg-Frömern"
          onChange={(value) => setProfile({ ...profile, ort: value })}
        />
        <TextInput
          label="WhatsApp"
          value={profile.kontakt_whatsapp}
          placeholder="z. B. 491701234567"
          onChange={(value) =>
            setProfile({ ...profile, kontakt_whatsapp: value })
          }
        />
        <TextInput
          label="Kontakt-E-Mail"
          value={profile.kontakt_email}
          placeholder="du@example.de"
          onChange={(value) =>
            setProfile({ ...profile, kontakt_email: value })
          }
        />
        <TextInput
          label="Telefon"
          value={profile.kontakt_telefon}
          placeholder="z. B. 0170 1234567"
          onChange={(value) =>
            setProfile({ ...profile, kontakt_telefon: value })
          }
        />
        <label className="flex min-h-14 items-center gap-3 rounded-lg bg-[#f7fbff] px-4 text-sm font-bold text-[#172033] ring-1 ring-[#dbe7ff]">
          <input
            type="checkbox"
            checked={profile.email_benachrichtigungen}
            onChange={(event) =>
              setProfile({
                ...profile,
                email_benachrichtigungen: event.target.checked,
              })
            }
            className="size-5 accent-[#132a74]"
          />
          E-Mail-Benachrichtigungen erlauben
        </label>
      </div>

      <button
        type="button"
        onClick={saveProfile}
        disabled={isSaving}
        className="mt-5 h-14 w-full rounded-lg bg-[#132a74] px-5 text-base font-black text-white shadow-sm disabled:opacity-70 sm:w-auto"
      >
        {isSaving ? "Speichern..." : "Profil speichern"}
      </button>

      <div className="mt-6 rounded-lg bg-[#fff3f1] p-4 ring-1 ring-[#ffd0c8]">
        <p className="font-black text-[#9f2f21]">Konto löschen</p>
        <p className="mt-2 text-sm leading-6 text-[#6f3d35]">
          Dadurch werden dein Konto, dein Profil, deine Stickerlisten und deine
          Benachrichtigungen gelöscht. Tippe zur Bestätigung LÖSCHEN ein.
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(event) => setDeleteConfirm(event.target.value)}
          placeholder="LÖSCHEN"
          className="mt-3 h-12 w-full rounded-lg border border-[#ffd0c8] bg-white px-4 text-base outline-none focus:border-[#e44533]"
        />
        <button
          type="button"
          onClick={deleteAccount}
          disabled={isDeleting}
          className="mt-3 h-12 rounded-lg bg-[#e44533] px-5 text-sm font-black text-white disabled:opacity-70"
        >
          {isDeleting ? "Löschen..." : "Konto endgültig löschen"}
        </button>
      </div>
    </section>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");

  return (
    <label className="block text-sm font-bold" htmlFor={id}>
      {label}
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base font-normal outline-none focus:border-[#132a74]"
      />
    </label>
  );
}
