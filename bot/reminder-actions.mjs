import * as chrono from "chrono-node";

export const reminderTimeZone = "Etc/GMT+5";

export function parseDue(text, reference = new Date()) {
  const due = chrono.parseDate(text, { instant: reference, timezone: -300 }, { forwardDate: true });
  if (!due || !Number.isFinite(due.getTime())) throw new Error(`I could not understand the due date: ${text}`);
  return due.toISOString();
}

export function formatDiscordDate(iso) {
  return `${new Date(iso).toLocaleString("en-US", {
    timeZone: reminderTimeZone, year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit"
  })} EST`;
}

export function reminderActionId(reminder, action) {
  return `reminder:${action}:${reminder.id}:${new Date(reminder.dueAt).getTime()}`;
}

export function parseReminderAction(id) {
  const match = id.match(/^reminder:(complete|snooze10|snooze60):([^:]+):(\d+)$/);
  return match ? { action: match[1], id: match[2], dueTime: Number(match[3]) } : null;
}

export function reminderActionPatch(reminder, action, reference = new Date()) {
  if (!reminder || reminder.deletedAt) throw new Error("This reminder no longer exists.");
  if (reminder.completed || reminder.dismissed) throw new Error("This reminder has already been completed or dismissed.");
  if (new Date(reminder.dueAt).getTime() !== action.dueTime) throw new Error("This notification is out of date. Use the newest reminder message.");
  if (action.action === "complete") return { completed: 1, discordNotificationStatus: "completed" };
  const minutes = action.action === "snooze10" ? 10 : 60;
  return {
    dueAt: new Date(reference.getTime() + minutes * 60_000).toISOString(),
    completed: 0, dismissed: 0, dismissedAt: null, notified: 0, notifiedAt: null,
    discordNotificationStatus: "pending", discordNotificationSentAt: null, discordNotificationError: null
  };
}
