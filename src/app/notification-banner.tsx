"use client";

import { useCallback, useEffect, useState } from "react";
import { findSticker, stickerLabel } from "@/lib/katalog";
import { supabase } from "@/lib/supabase";

type NotificationBannerProps = {
  userId: string;
  refreshKey: number;
};

type Notification = {
  id: string;
  actor_user_id: string | null;
  sticker_code: string;
  message: string;
  created_at: string;
};

type UserSticker = {
  user_id: string;
  sticker_code: string;
  liste: "habe" | "suche";
};

export function NotificationBanner({
  userId,
  refreshKey,
}: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("notifications")
      .select("id, actor_user_id, sticker_code, message, created_at")
      .eq("user_id", userId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(25);

    if (loadError) {
      setError(
        "Benachrichtigungen sind vorbereitet. Bitte fuehre die SQL-Datei 04-notifications.sql in Supabase aus.",
      );
      return;
    }

    const unreadNotifications = (data ?? []) as Notification[];
    const { data: stickerData, error: stickerError } = await supabase
      .from("user_stickers")
      .select("user_id, sticker_code, liste");

    if (stickerError) {
      setError(stickerError.message);
      return;
    }

    const stickers = (stickerData ?? []) as UserSticker[];
    const activeNotifications = unreadNotifications.filter((notification) =>
      isActiveNotification(notification, userId, stickers),
    );
    const staleNotificationIds = unreadNotifications
      .filter(
        (notification) =>
          !activeNotifications.some((active) => active.id === notification.id),
      )
      .map((notification) => notification.id);

    if (staleNotificationIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", staleNotificationIds);
    }

    setError("");
    setNotifications(activeNotifications.slice(0, 5));
  }, [userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadNotifications, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadNotifications, refreshKey]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, userId]);

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
          Sobald jemand einen deiner gesuchten Sticker anbietet oder eine Karte
          sucht, die du doppelt hast, erscheint hier direkt ein Hinweis.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-[#fed447] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-[#172033]">
            Gute Nachricht: {notifications.length} neue aktive Sticker-Treffer!
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

function isActiveNotification(
  notification: Notification,
  userId: string,
  stickers: UserSticker[],
) {
  if (!notification.actor_user_id) {
    return false;
  }

  const myEntries = stickers.filter(
    (entry) =>
      entry.user_id === userId && entry.sticker_code === notification.sticker_code,
  );
  const actorEntries = stickers.filter(
    (entry) =>
      entry.user_id === notification.actor_user_id &&
      entry.sticker_code === notification.sticker_code,
  );

  return myEntries.some((mine) =>
    actorEntries.some(
      (theirs) =>
        (mine.liste === "suche" && theirs.liste === "habe") ||
        (mine.liste === "habe" && theirs.liste === "suche"),
    ),
  );
}
