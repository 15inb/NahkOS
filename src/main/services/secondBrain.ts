import { app, shell } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import type { AppData, SecondBrainIndex, SecondBrainItem, SecondBrainKind } from "../../shared/types.js";
import { JsonStore } from "./storage.js";

const now = () => new Date().toISOString();
const archiveExt = new Set([".zip", ".rar", ".7z", ".tar", ".gz", ".iso"]);
const screenshotExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"]);
const clipExt = new Set([".mp4", ".mov", ".mkv", ".webm", ".avi"]);

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9:\\/._ -]+/g, " ").replace(/\s+/g, " ").trim();
}

function basename(value = "") {
  return path.basename(value) || value || "Untitled";
}

function stableId(kind: SecondBrainKind, key: string) {
  return `${kind}:${Buffer.from(key).toString("base64url").slice(0, 80)}`;
}

function push(items: SecondBrainItem[], item: SecondBrainItem) {
  if (!item.title.trim()) return;
  items.push({
    ...item,
    preview: item.preview.slice(0, 320),
    tags: Array.from(new Set(item.tags.filter(Boolean).map((tag) => tag.trim()).filter(Boolean)))
  });
}

function isExcluded(target: string, excludedFolders: string[]) {
  const lower = path.resolve(target).toLowerCase();
  return excludedFolders.some((excluded) => {
    const resolved = path.resolve(expandHome(excluded)).toLowerCase();
    return lower === resolved || lower.startsWith(`${resolved}${path.sep}`);
  });
}

function expandHome(value: string) {
  if (!value) return value;
  if (value === "~") return app.getPath("home");
  if (value.startsWith(`~${path.sep}`) || value.startsWith("~/")) return path.join(app.getPath("home"), value.slice(2));
  return value;
}

async function scanFolder(folder: string, kind: "download" | "screenshot" | "clip", settings: AppData["settings"]["secondBrain"], limit: number) {
  const root = expandHome(folder);
  const items: SecondBrainItem[] = [];
  const queue: Array<{ folder: string; depth: number }> = [{ folder: root, depth: 0 }];
  let skipped = 0;
  while (queue.length && items.length < limit) {
    const current = queue.shift()!;
    if (isExcluded(current.folder, settings.excludedFolders)) {
      skipped += 1;
      continue;
    }
    let entries: Array<import("node:fs").Dirent>;
    try {
      entries = await fs.readdir(current.folder, { withFileTypes: true });
    } catch {
      skipped += 1;
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current.folder, entry.name);
      if (isExcluded(fullPath, settings.excludedFolders)) {
        skipped += 1;
        continue;
      }
      if (entry.isDirectory()) {
        if (current.depth < 2) queue.push({ folder: fullPath, depth: current.depth + 1 });
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      const matchesKind =
        kind === "screenshot" ? screenshotExt.has(ext) :
        kind === "clip" ? clipExt.has(ext) :
        true;
      if (!matchesKind) continue;
      let stat: Awaited<ReturnType<typeof fs.stat>>;
      try {
        stat = await fs.stat(fullPath);
      } catch {
        skipped += 1;
        continue;
      }
      const tags = kind === "download" && archiveExt.has(ext) ? ["archive"] : [];
      push(items, {
        id: stableId(kind, fullPath),
        kind,
        title: entry.name,
        preview: kind === "download" ? `Downloaded file in ${current.folder}` : `${kind} saved in ${current.folder}`,
        source: kind === "download" ? "Downloads" : kind === "screenshot" ? "Screenshots" : "Clips",
        path: fullPath,
        tags,
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
        lastAccessedAt: stat.atime.toISOString(),
        size: stat.size
      });
      if (items.length >= limit) break;
    }
  }
  return { items, skipped };
}

function appItems(data: AppData) {
  const settings = data.settings.secondBrain;
  const items: SecondBrainItem[] = [];
  for (const note of data.notes) {
    push(items, {
      id: stableId("note", note.id),
      kind: "note",
      title: note.title,
      preview: note.body,
      source: note.kind === "snippet" ? "Snippets" : "Notes",
      tags: note.tags,
      pinned: note.pinned,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });
  }
  if (settings.includeClipboard) {
    for (const clip of data.clipboard) {
      push(items, {
        id: stableId("clipboard", clip.id),
        kind: "clipboard",
        title: clip.text.slice(0, 80) || "Clipboard item",
        preview: clip.text,
        source: "Clipboard",
        tags: clip.pinned ? ["pinned"] : [],
        pinned: clip.pinned,
        createdAt: clip.createdAt,
        updatedAt: clip.createdAt
      });
    }
  }
  for (const reminder of data.reminders) {
    push(items, {
      id: stableId("reminder", reminder.id),
      kind: "reminder",
      title: reminder.title || reminder.text || "Reminder",
      preview: `${reminder.notes || ""}${reminder.dueAt ? ` Due ${new Date(reminder.dueAt).toLocaleString()}` : ""}`,
      source: "Reminders",
      tags: [reminder.priority || "", reminder.category || "", reminder.completed ? "completed" : "pending"],
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      lastAccessedAt: reminder.dueAt
    });
  }
  if (settings.includeFiles) {
    for (const file of data.fileIndex.slice(0, settings.maxIndexedFiles)) {
      if (isExcluded(file.path, settings.excludedFolders)) continue;
      const ext = file.extension ? file.extension.toLowerCase() : "";
      push(items, {
        id: stableId("file", file.path),
        kind: "file",
        title: file.name,
        preview: file.path,
        source: file.type === "folder" ? "Indexed folders" : "Indexed files",
        path: file.path,
        tags: [file.type, ext].filter(Boolean),
        createdAt: file.modifiedAt,
        updatedAt: file.modifiedAt,
        lastAccessedAt: file.modifiedAt,
        size: file.size
      });
    }
  }
  for (const command of data.commands) {
    push(items, {
      id: stableId("command", command.id),
      kind: "command",
      title: command.name,
      preview: command.value,
      source: "Command Palette",
      tags: [command.kind, command.favorite ? "favorite" : ""],
      favorite: command.favorite,
      createdAt: command.createdAt,
      updatedAt: command.updatedAt,
      lastAccessedAt: command.lastRunAt
    });
  }
  for (const project of data.projects) {
    push(items, {
      id: stableId("project", project.path),
      kind: "project",
      title: project.name || basename(project.path),
      preview: project.path,
      source: "Workspaces",
      path: project.path,
      tags: project.pinned ? ["favorite"] : [],
      favorite: project.pinned,
      pinned: project.pinned,
      createdAt: project.lastOpenedAt,
      updatedAt: project.lastOpenedAt,
      lastAccessedAt: project.lastOpenedAt
    });
  }
  if (settings.includeEntertainment) {
    for (const activity of data.entertainmentActivities) {
      push(items, {
        id: stableId(activity.profile === "gaming" ? "game" : "media", activity.id),
        kind: activity.profile === "gaming" ? "game" : "media",
        title: activity.title || activity.appName,
        preview: `${activity.profile} session in ${activity.appName} for ${Math.round(activity.durationSeconds / 60)} minutes`,
        source: activity.profile === "gaming" ? "Games" : "Media",
        path: activity.path,
        tags: [activity.kind, activity.profile, activity.genre || ""],
        favorite: activity.favorite,
        createdAt: activity.startedAt,
        updatedAt: activity.endedAt || activity.startedAt,
        lastAccessedAt: activity.endedAt || activity.startedAt
      });
    }
  }
  if (settings.includeAiChats) {
    for (const message of data.aiConversation.messages) {
      push(items, {
        id: stableId("ai-chat", message.id),
        kind: "ai-chat",
        title: message.role === "user" ? `Question: ${message.content.slice(0, 70)}` : `Assistant: ${message.content.slice(0, 70)}`,
        preview: message.content,
        source: "AI Assistant",
        tags: [message.role, ...(message.sources ?? [])],
        createdAt: message.createdAt,
        updatedAt: message.createdAt
      });
    }
  }
  for (const session of data.codexSessions) {
    push(items, {
      id: stableId("codex-session", session.id),
      kind: "codex-session",
      title: session.title,
      preview: `${session.status}: ${session.prompt}`,
      source: "Codex",
      path: session.projectFolder,
      tags: [session.status],
      createdAt: session.startedAt,
      updatedAt: session.finishedAt || session.startedAt,
      lastAccessedAt: session.finishedAt || session.startedAt
    });
  }
  for (const snapshot of data.storageTimelineSnapshots) {
    push(items, {
      id: stableId("storage-scan", snapshot.id),
      kind: "storage-scan",
      title: `Storage scan: ${basename(snapshot.targetPath) || snapshot.targetPath}`,
      preview: `${snapshot.scannedFiles} files, ${snapshot.scannedFolders} folders, ${snapshot.skippedProtectedCount} protected locations skipped`,
      source: "Storage Scanner",
      path: snapshot.targetPath,
      tags: [snapshot.targetType],
      createdAt: snapshot.capturedAt,
      updatedAt: snapshot.capturedAt,
      size: snapshot.scannedBytes
    });
  }
  return items;
}

function mergePinnedState(fresh: SecondBrainItem[], existing: SecondBrainItem[]) {
  const state = new Map(existing.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const merged = fresh.map((item) => {
    seen.add(item.id);
    const old = state.get(item.id);
    return old ? { ...item, favorite: old.favorite ?? item.favorite, pinned: old.pinned ?? item.pinned, archived: old.archived ?? item.archived, tags: Array.from(new Set([...item.tags, ...old.tags])) } : item;
  });
  for (const old of existing) {
    if (!seen.has(old.id) && (old.favorite || old.pinned || old.archived)) merged.push(old);
  }
  return merged;
}

function rank(item: SecondBrainItem, query: string) {
  if (!query.trim()) return 1;
  const haystack = normalize(`${item.title} ${item.preview} ${item.path ?? ""} ${item.tags.join(" ")} ${item.source}`);
  const title = normalize(item.title);
  const tokens = normalize(query).split(" ").filter(Boolean);
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 8;
    if (haystack.includes(token)) score += 4;
    if (fuzzyToken(haystack, token)) score += 1;
  }
  if (item.pinned) score += 2;
  if (item.favorite) score += 1.5;
  return score;
}

function fuzzyToken(haystack: string, token: string) {
  if (token.length < 4) return false;
  let index = 0;
  for (const char of haystack) {
    if (char === token[index]) index += 1;
    if (index === token.length) return true;
  }
  return false;
}

function byKind(items: SecondBrainItem[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item.kind] = (counts[item.kind] ?? 0) + 1;
    return counts;
  }, {});
}

export async function buildSecondBrainIndex(store: JsonStore): Promise<SecondBrainIndex> {
  const data = await store.read();
  const settings = data.settings.secondBrain;
  if (!settings.enabled) {
    return { indexedAt: now(), items: data.secondBrainItems ?? [], stats: { total: data.secondBrainItems?.length ?? 0, byKind: byKind(data.secondBrainItems ?? []), indexedFolders: 0, skipped: 0 } };
  }
  const fresh = appItems(data);
  let skipped = 0;
  let indexedFolders = 0;
  const remaining = Math.max(100, settings.maxIndexedFiles - fresh.length);
  if (settings.includeDownloads) {
    const downloads = await scanFolder(path.join(app.getPath("home"), "Downloads"), "download", settings, Math.ceil(remaining / 3));
    fresh.push(...downloads.items);
    skipped += downloads.skipped;
    indexedFolders += 1;
  }
  if (settings.includeScreenshots) {
    for (const folder of settings.screenshotFolders) {
      const scan = await scanFolder(folder, "screenshot", settings, Math.ceil(remaining / 4));
      fresh.push(...scan.items);
      skipped += scan.skipped;
      indexedFolders += 1;
    }
    for (const folder of settings.clipFolders) {
      const scan = await scanFolder(folder, "clip", settings, Math.ceil(remaining / 4));
      fresh.push(...scan.items);
      skipped += scan.skipped;
      indexedFolders += 1;
    }
  }
  const cutoff = Date.now() - Math.max(1, settings.retentionDays) * 24 * 60 * 60 * 1000;
  const retained = mergePinnedState(fresh, data.secondBrainItems ?? [])
    .filter((item) => item.pinned || item.favorite || item.archived || new Date(item.updatedAt || item.createdAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, settings.maxIndexedFiles);
  await store.patch((current) => ({ ...current, secondBrainItems: retained }));
  return { indexedAt: now(), items: retained, stats: { total: retained.length, byKind: byKind(retained), indexedFolders, skipped } };
}

export async function searchSecondBrain(store: JsonStore, query: string, kind?: SecondBrainKind | "all") {
  const data = await store.read();
  let items = data.secondBrainItems?.length ? data.secondBrainItems : appItems(data);
  if (kind && kind !== "all") items = items.filter((item) => item.kind === kind);
  return items
    .filter((item) => !item.archived)
    .map((item) => ({ ...item, score: rank(item, query) }))
    .filter((item) => !query.trim() || (item.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 120);
}

export async function secondBrainTimeline(store: JsonStore, kind?: SecondBrainKind | "all") {
  const data = await store.read();
  return (data.secondBrainItems ?? [])
    .filter((item) => !item.archived && (!kind || kind === "all" || item.kind === kind))
    .sort((a, b) => new Date(b.lastAccessedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.lastAccessedAt || a.updatedAt || a.createdAt).getTime())
    .slice(0, 240);
}

export async function updateSecondBrainItem(store: JsonStore, id: string, patch: Partial<Pick<SecondBrainItem, "favorite" | "pinned" | "archived" | "tags">>) {
  return store.patch((data) => ({
    ...data,
    secondBrainItems: (data.secondBrainItems ?? []).map((item) => item.id === id ? { ...item, ...patch, updatedAt: now() } : item)
  }));
}

export async function removeSecondBrainItem(store: JsonStore, id: string) {
  return store.patch((data) => ({ ...data, secondBrainItems: (data.secondBrainItems ?? []).filter((item) => item.id !== id) }));
}

export async function openSecondBrainItem(store: JsonStore, id: string) {
  const item = (await store.read()).secondBrainItems.find((row) => row.id === id);
  if (!item) throw new Error("That Second Brain item no longer exists.");
  if (item.path) return shell.openPath(item.path);
  if (item.url) {
    await shell.openExternal(item.url);
    return "";
  }
  return "";
}

export async function revealSecondBrainItem(store: JsonStore, id: string) {
  const item = (await store.read()).secondBrainItems.find((row) => row.id === id);
  if (!item?.path) throw new Error("This item does not have a file or folder path.");
  shell.showItemInFolder(item.path);
}
