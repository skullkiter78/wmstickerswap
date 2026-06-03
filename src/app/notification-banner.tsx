"use client";

import { useEffect, useState } from "react";
import { findSticker, stickerLabel } from "@/lib/katalog";
import { supabase } from "@/lib/supabase";

type NotificationBannerProps = {
  userId: string;
  refreshKey: number;
};

type Notification = {
  id: string;
  sticker_code: string;
  message: string;
  created_at: string;
};

export function NotificationBanner({
  userId,
  refreshKey,
}: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotifications() {
      const { data, error: loadError } = await supabase
        .from("notifications")
        .select("id, sticker_code, message, created_at")
        .eq("user_id", userId)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (loadError) {
        setError(
          "Benachrichtigungen sind vorbereitet. Bitte führe die SQL-Datei 04-notifications.sql in Supabase aus.",
        );
        return;
      }

      setError("");
      setNotifications((data ?? []) as Notification[]);
    }

    loadNotifications();
  }, [userId, refreshKey]);

  async function markAsRead() {
    const ids = notifications.map((notification) => notification.id);

    if (ids.length === 0) {
      return;
    }

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    setNotifications([]);
  }

  if (error) {
    return (
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff]">
        <p className="text-sm font-bold text-[#e44533]">Hinweis</p>
        <p className="mt-2 text-sm leading-6 text-[#5d6b86]">{error}</p>
      </section>
    );
  }

  if (notifications.length === 0) {
    return (
      <section className="rounded-lg bg-[#fed447] p-5 shadow-sm">
        <p className="font-black text-[#172033]">
          Noch keine neuen Treffer seit deinem letzten Besuch.
        </p>
        <p className="mt-2 text-sm leading-6 text-[#33415c]">
          Sobald jemand einen deiner gesuchten Sticker anbietet, erscheint hier
          direkt nach dem Login ein Hinweis.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-[#fed447] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-[#172033]">
            Gute Nachricht: {notifications.length} deiner gesuchten Karten sind
            neu im Angebot!
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-6 text-[#33415c]">
            {notifications.map((notification) => {
              const sticker = findSticker(notification.sticker_code);

              return (
                <p key={notification.id}>
                  {notification.message}{" "}
                  <span className="font-black">
                    {sticker ? stickerLabel(sticker) : notification.sticker_code}
                  </span>
                </p>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={markAsRead}
          className="h-12 rounded-lg bg-[#132a74] px-4 text-sm font-black text-white"
        >
          Gelesen
        </button>
      </div>
    </section>
  );
}
