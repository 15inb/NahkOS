export type ThemeMode = "dark" | "oled" | "midnight" | "light" | "system";
export type CommandKind = "app" | "website" | "file" | "folder" | "script" | "ssh";
export type CodexSessionStatus = "active" | "completed" | "failed" | "cancelled";

export interface CommandItem {
  id: string;
  name: string;
  kind: CommandKind;
  value: string;
  args?: string;
  favorite: boolean;
  dangerous?: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runCount: number;
}

export interface FileRecord {
  id: string;
  name: string;
  path: string;
  directory: string;
  type: "file" | "folder";
  extension: string;
  modifiedAt: string;
  size: number;
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  kind: "note" | "snippet";
  createdAt: string;
  updatedAt: string;
}

export interface ClipboardItem {
  id: string;
  text: string;
  pinned: boolean;
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  text: string;
  title?: string;
  notes?: string;
  dueAt: string;
  priority?: string;
  category?: string;
  completed: boolean;
  dismissed?: boolean;
  notified?: boolean;
  notifiedAt?: string;
  dismissedAt?: string;
  discordNotificationStatus?: "pending" | "sent" | "failed" | "dismissed" | "snoozed" | "completed";
  discordNotificationSentAt?: string;
  discordNotificationError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  theme: ThemeMode;
  accent: string;
  launchAtStartup: boolean;
  globalShortcut: string;
  indexedFolders: string[];
  projectFolders: string[];
  defaultWorkingDirectory: string;
  codexExecutablePath: string;
  monitoring: MonitoringSettings;
  ai: AiSettings;
  discord: DiscordSettings;
  updates: UpdateSettings;
  entertainment: EntertainmentSettings;
}

export type ImmersiveProfile = "gaming" | "watching" | "streaming" | "focus";
export type EntertainmentKind = "game" | "show" | "movie" | "video" | "media" | "launcher" | "unknown";

export interface EntertainmentSettings {
  trackingEnabled: boolean;
  immersiveEnabled: boolean;
  autoDetect: boolean;
  monitorDimmingEnabled: boolean;
  dimAmount: number;
  dimFadeMs: number;
  onlyDimFullscreenPlayback: boolean;
  dimInactiveMonitorsOnly: boolean;
  keepOverlayMonitorUndimmed: boolean;
  excludedMonitorIds: number[];
  dimDebug: boolean;
  suppressNotifications: boolean;
  hideOverlay: boolean;
  lowerOverlayOpacity: boolean;
  pauseBackgroundScans: boolean;
  reduceMonitoringRefresh: boolean;
  performanceMode: boolean;
  autoExit: boolean;
  allowedNotifications: string[];
  excludedApps: string[];
  manualProfile: ImmersiveProfile | "off";
  appRules: Array<{ pattern: string; profile: ImmersiveProfile; enabled: boolean }>;
}

export interface EntertainmentActivity {
  id: string;
  title: string;
  appName: string;
  executable: string;
  path: string;
  kind: EntertainmentKind;
  profile: ImmersiveProfile;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  idleSeconds?: number;
  source: "process" | "window-title" | "manual";
  favorite?: boolean;
  posterUrl?: string;
  genre?: string;
}

export interface EntertainmentDetectedApp {
  pid: number;
  title: string;
  appName: string;
  executable: string;
  path: string;
  kind: EntertainmentKind;
  profile: ImmersiveProfile;
  confidence: number;
  reason: string;
}

export interface EntertainmentSnapshot {
  active: boolean;
  profile: ImmersiveProfile | "off";
  reason: string;
  detected: EntertainmentDetectedApp[];
  activeSession: EntertainmentActivity | null;
  recent: EntertainmentActivity[];
  totals: {
    gameSeconds: number;
    watchSeconds: number;
    sessions: number;
    thisWeekSeconds: number;
  };
  privacy: {
    localOnly: boolean;
    trackingEnabled: boolean;
    excludedApps: string[];
  };
}

export interface EntertainmentRecommendation {
  id: string;
  title: string;
  category: "Tonight's Pick" | "Continue Playing" | "Continue Watching" | "Short Session" | "Hidden Gem" | "Insight";
  explanation: string;
  actionLabel: string;
  relatedTitle?: string;
  confidence: "low" | "medium" | "high";
  source: "openai" | "local";
}

export interface UpdateSettings {
  enabled: boolean;
  feedUrl: string;
  checkOnStartup: boolean;
  lastCheckedAt?: string;
}

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  fileSize: number;
  publishedAt: string;
  sha256?: string;
  portableUrl?: string;
  portableFileSize?: number;
  portableSha256?: string;
}

export interface UpdateCheckResult {
  available: boolean;
  currentVersion: string;
  latest: UpdateInfo | null;
  error?: string;
}

export interface DiscordSettings {
  enabled: boolean;
  targetUserId: string;
  backendUrl: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: "success" | "failed";
  lastSyncError?: string;
  lastTestAt?: string;
  lastTestStatus?: "success" | "failed";
  lastTestError?: string;
}

export interface AiPrivacySettings {
  hardwareStats: boolean;
  processNames: boolean;
  filePaths: boolean;
  storageScanSummaries: boolean;
  eventLogs: boolean;
  crashLogs: boolean;
}

export interface AiSettings {
  model: string;
  previewContext: boolean;
  privacy: AiPrivacySettings;
}

export interface MonitoringSettings {
  refreshMs: number;
  historyLimit: number;
  lowPowerMode: boolean;
  pauseWhenMinimized: boolean;
  disableBackgroundIndexing: boolean;
  maxHistoryPoints: number;
  maxClipboardEntries: number;
  maxProcessRefreshMs: number;
  cpuTempAlert: number;
  gpuTempAlert: number;
  ramAlertPercent: number;
  storageAlertPercent: number;
  networkAlertMbps: number;
  storageTimelineRetentionDays: number;
  gamePerformanceTrackingEnabled: boolean;
  gamePerformanceSampleMs: number;
  enableAlerts: boolean;
  enableOverlay: boolean;
  overlayMode: "compact" | "expanded";
  overlayOpacity: number;
  overlayRefreshMs: number;
  overlayClickThrough: boolean;
  overlayHotkey: string;
  overlayPosition: { x: number; y: number };
  overlayPositionPreset: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  overlayFontSize: number;
  overlaySpacing: number;
  overlayTextColor: string;
  overlayShadow: boolean;
  overlayDebug: boolean;
  overlayMetrics: {
    cpu: boolean;
    cpuTemp: boolean;
    gpu: boolean;
    gpuTemp: boolean;
    ram: boolean;
    vram: boolean;
    network: boolean;
    fps: boolean;
  };
}

export interface ProjectEntry {
  path: string;
  name: string;
  pinned: boolean;
  lastOpenedAt: string;
}

export interface CodexPromptTemplate {
  id: string;
  name: string;
  prompt: string;
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CodexSession {
  id: string;
  title: string;
  prompt: string;
  projectFolder: string;
  executablePath: string;
  status: CodexSessionStatus;
  output: string;
  error?: string;
  exitCode?: number | null;
  gitStatusBefore: string;
  gitStatusAfter?: string;
  changedFiles: string[];
  startedAt: string;
  finishedAt?: string;
}

export interface AppData {
  settings: AppSettings;
  commands: CommandItem[];
  notes: NoteItem[];
  reminders: ReminderItem[];
  clipboard: ClipboardItem[];
  fileIndex: FileRecord[];
  codexTemplates: CodexPromptTemplate[];
  codexSessions: CodexSession[];
  projects: ProjectEntry[];
  aiConversation: AiConversation;
  storageScanLocations: StorageScanLocation[];
  storageTimelineSnapshots: StorageTimelineSnapshot[];
  gamePerformanceSessions: GamePerformanceSession[];
  stressTestHistory: StressTestResult[];
  entertainmentActivities: EntertainmentActivity[];
  entertainmentRecommendations: EntertainmentRecommendation[];
}

export interface WatchingModeStatus {
  active: boolean;
  reason: string;
  playbackDisplayId: number | null;
  playbackDisplayLabel: string;
  fullscreen: boolean;
  dimmedDisplayIds: number[];
  app?: string;
  title?: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface DiscordStatus {
  enabled: boolean;
  configured: boolean;
  targetUserId: string;
  backendUrl: string;
  syncEnabled: boolean;
  secureStorage: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: "success" | "failed";
  lastSyncError?: string;
  lastTestAt?: string;
  lastTestStatus?: "success" | "failed";
  lastTestError?: string;
}

export type StressTestKind = "cpu" | "memory" | "disk" | "gpu";
export type StressTestStatus = "idle" | "running" | "completed" | "stopped" | "failed" | "warning";

export interface StressTestOptions {
  kind: StressTestKind;
  durationSeconds: number;
  memoryPercent?: number;
}

export interface StressTestResult {
  id: string;
  kind: StressTestKind;
  name: string;
  status: StressTestStatus;
  startedAt: string;
  finishedAt?: string;
  durationSeconds: number;
  averageUsage: number;
  peakUsage: number;
  averageTemperature: number | null;
  peakTemperature: number | null;
  warnings: string[];
  summary: string;
  details?: string;
}

export interface StressTestSession {
  active: boolean;
  result: StressTestResult | null;
  progress: number;
  live: {
    cpuUsage: number;
    ramUsage: number;
    cpuTemp: number | null;
    gpuTemp: number | null;
  };
}

export interface StorageScanLocation {
  path: string;
  label: string;
  kind: "drive" | "folder";
  pinned: boolean;
  lastScannedAt: string;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: string[];
  error?: string;
}

export interface AiConversation {
  messages: AiChatMessage[];
  updatedAt: string;
}

export interface AiStatus {
  configured: boolean;
  secureStorage: boolean;
  model: string;
  privacy: AiPrivacySettings;
  lastError?: string;
}

export interface AiContextPreview {
  summary: string;
  categories: string[];
  redactions: string[];
  payload: unknown;
}

export interface AiChatRequest {
  message: string;
  mode: "simple" | "advanced";
}

export interface AiStreamEvent {
  kind: "start" | "sources" | "delta" | "done" | "error";
  requestId: string;
  sources?: string[];
  delta?: string;
  message?: AiChatMessage;
  error?: string;
}

export interface AiStorageRecommendation {
  id: string;
  category: "Safe to review" | "Review carefully" | "Advanced users only" | "Excluded/protected";
  title: string;
  explanation: string;
  estimatedReclaimableBytes: number;
  priority: "low" | "medium" | "high";
  sourcePaths: string[];
  risk: string;
}

export interface AiDiagnosisReport {
  id: string;
  kind: "pc-slow" | "storage-timeline" | "fps-drop";
  createdAt: string;
  content: string;
  sources: string[];
  contextSummary: string;
}

export interface StorageTimelineSnapshot {
  id: string;
  scanId: string;
  capturedAt: string;
  targetPath: string;
  targetType: "drive" | "folder";
  scannedBytes: number;
  scannedFiles: number;
  scannedFolders: number;
  topFolders: Array<{ path: string; name: string; size: number; safety: StorageSafety; modifiedAt: string }>;
  topFiles: Array<{ path: string; name: string; size: number; safety: StorageSafety; modifiedAt: string; extension: string }>;
  typeBreakdown: StorageTypeBreakdown[];
  skippedProtectedCount: number;
}

export interface StorageTimelineEvent {
  id: string;
  kind: "growth" | "shrinkage" | "new-large-file" | "removed-large-file" | "category-growth" | "category-shrinkage";
  title: string;
  path?: string;
  category?: string;
  deltaBytes: number;
  previousBytes: number;
  currentBytes: number;
  capturedAt: string;
  safety: StorageSafety | "unknown";
}

export interface StorageTimeline {
  snapshots: StorageTimelineSnapshot[];
  events: StorageTimelineEvent[];
  totals: Array<{ capturedAt: string; scannedBytes: number; targetPath: string }>;
}

export interface GamePerformanceSample {
  time: string;
  fps: number | null;
  cpuUsage: number;
  gpuUsage: number | null;
  cpuTemp: number | null;
  gpuTemp: number | null;
  ramPercent: number;
  vramPercent: number | null;
  diskReadBps: number;
  diskWriteBps: number;
  networkRxBps: number;
  networkTxBps: number;
}

export interface GamePerformanceSession {
  id: string;
  title: string;
  appName: string;
  executable: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  samples: GamePerformanceSample[];
  summary: {
    averageFps: number | null;
    minFps: number | null;
    averageCpu: number;
    peakCpu: number;
    averageGpu: number | null;
    peakGpu: number | null;
    peakRamPercent: number;
    peakVramPercent: number | null;
    peakCpuTemp: number | null;
    peakGpuTemp: number | null;
  };
}

export interface CommandRunResult {
  commandId?: string;
  stdout: string;
  stderr: string;
  code: number | null;
  startedAt: string;
  finishedAt: string;
}

export interface SystemStats {
  cpuUsage: number;
  ramUsed: number;
  ramTotal: number;
  uptime: number;
  disks: Array<{ name: string; used: number; total: number }>;
  networks: Array<{ name: string; address: string; family: string }>;
  processes: Array<{ pid: number; name: string; cpu: number; memory: number }>;
}

export interface LightSystemSnapshot {
  capturedAt: string;
  uptime: number;
  healthScore: number;
  healthLabel: string;
  alerts: string[];
  cpu: {
    usage: number;
    perCore: number[];
    cores: number;
    temperature: number | null;
    clockMHz: number | null;
  };
  gpu: {
    usage: number | null;
    temperature: number | null;
    vramUsed: number | null;
    vramTotal: number | null;
  };
  ram: {
    used: number;
    total: number;
  };
  disks: Array<{ name: string; label: string; used: number; total: number; readBps: number; writeBps: number }>;
  network: {
    adapters: Array<{ name: string; address: string; family: string }>;
    rxBps: number;
    txBps: number;
  };
  history: MetricPoint[];
}

export interface SystemSnapshotOptions {
  includeProcesses?: boolean;
  includeStartup?: boolean;
  includeSpecs?: boolean;
  writeHistory?: boolean;
}

export interface PerformanceDiagnostics {
  capturedAt: string;
  process: {
    pid: number;
    cpuPercent: number;
    memoryRss: number;
    heapUsed: number;
    uptimeSeconds: number;
  };
  windows: {
    mainVisible: boolean;
    mainMinimized: boolean;
    overlayCreated: boolean;
    overlayVisible: boolean;
  };
  pollers: Array<{ name: string; active: boolean; intervalMs?: number; note?: string }>;
  cache: {
    lightSnapshotAgeMs: number | null;
    fullSnapshotAgeMs: number | null;
    gpuAgeMs: number | null;
    cpuExtraAgeMs: number | null;
    networkAgeMs: number | null;
    diskAgeMs: number | null;
  };
  storage: {
    activeScan: boolean;
    lastScanTarget: string;
    lastScanStatus: string;
  };
  overlay: {
    refreshMs: number;
    lowPowerMode: boolean;
    positionPreset: string;
    debugLogging: boolean;
  };
}

export interface MetricPoint {
  time: string;
  cpuUsage: number;
  ramUsage: number;
  diskReadBps: number;
  diskWriteBps: number;
  networkRxBps: number;
  networkTxBps: number;
  cpuTemp?: number;
  gpuTemp?: number;
}

export interface HardwareSensor {
  label: string;
  value: number | null;
  unit: string;
  status: "ok" | "warn" | "unavailable";
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  path: string;
  commandLine: string;
  heavy: boolean;
  safeHint: string;
}

export interface StartupEntry {
  id: string;
  name: string;
  command: string;
  source: string;
  enabled: boolean;
  impact: "low" | "medium" | "high" | "unknown";
  canToggle?: boolean;
}

export interface StorageEntry {
  path: string;
  name: string;
  size: number;
  type: "file" | "folder";
}

export interface StorageAnalysis {
  root: string;
  scanned: number;
  largest: StorageEntry[];
  duplicates: StorageEntry[];
  tempBytes: number;
  recommendations: string[];
}

export interface DiskBenchmarkResult {
  writeMbps: number;
  readMbps: number;
  sizeBytes: number;
  target: string;
}

export type StorageSafety = "safe" | "careful" | "protected";

export interface StorageScanTarget {
  path: string;
  label: string;
  kind: "drive" | "folder" | "common";
}

export interface StorageScanOptions {
  targets: string[];
  targetType?: "drive" | "folder";
  includeProtected: boolean;
  minSizeBytes: number;
  fileType: string;
  modifiedAfter: string;
  safeOnly: boolean;
}

export interface StorageScanItem {
  path: string;
  name: string;
  type: "file" | "folder";
  size: number;
  fileCount: number;
  modifiedAt: string;
  percent: number;
  extension: string;
  safety: StorageSafety;
  reason: string;
}

export interface StorageTypeBreakdown {
  type: string;
  size: number;
  count: number;
  percent: number;
}

export interface StorageScanResult {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "idle" | "running" | "paused" | "cancelled" | "completed" | "failed";
  roots: string[];
  targetPath: string;
  targetType: "drive" | "folder";
  includeProtected: boolean;
  scannedBytes: number;
  scannedFiles: number;
  scannedFolders: number;
  currentPath: string;
  largestFiles: StorageScanItem[];
  largestFolders: StorageScanItem[];
  duplicates?: StorageScanItem[];
  typeBreakdown: StorageTypeBreakdown[];
  treemap: StorageScanItem[];
  skipped: Array<{ path: string; reason: string; protected: boolean }>;
  suggestions: string[];
  error?: string;
}

export interface StorageScanStatus {
  active: boolean;
  result: StorageScanResult | null;
  cached: StorageScanResult | null;
}

export interface SystemSnapshot {
  capturedAt: string;
  healthScore: number;
  healthLabel: string;
  uptime: number;
  alerts: string[];
  sensors: HardwareSensor[];
  history: MetricPoint[];
  cpu: {
    model: string;
    usage: number;
    clockMHz: number | null;
    cores: number;
    perCore: number[];
    temperature: number | null;
    voltage: number | null;
  };
  gpu: {
    model: string;
    usage: number | null;
    temperature: number | null;
    vramUsed: number | null;
    vramTotal: number | null;
    powerDraw: number | null;
  };
  ram: {
    used: number;
    total: number;
    speedMHz: number | null;
  };
  disks: Array<{ name: string; label: string; used: number; total: number; temperature: number | null; readBps: number; writeBps: number }>;
  network: {
    adapters: Array<{ name: string; address: string; family: string }>;
    rxBps: number;
    txBps: number;
    externalIp: string;
    latencyMs: number | null;
  };
  battery: { percent: number | null; status: string };
  fans: HardwareSensor[];
  power: { drawWatts: number | null };
  processes: ProcessInfo[];
  startup: StartupEntry[];
  specs: {
    os: string;
    bios: string;
    motherboard: string;
    cpu: string;
    gpu: string;
    ram: string;
    storage: string[];
    monitors: string[];
    audio: string[];
    network: string[];
  };
}

export interface CodexRunRequest {
  title: string;
  prompt: string;
  requiresConfirmation: boolean;
  allowConcurrent?: boolean;
}

export interface CodexAvailability {
  available: boolean;
  executablePath: string;
  source: "settings" | "path" | "missing";
  version: string;
  projectFolder: string;
  projectValid: boolean;
  error?: string;
}
