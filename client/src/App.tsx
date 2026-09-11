import { FormEvent, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

interface ClientStatus {
  connected: boolean;
  apiBaseUrl?: string | null;
  libraryName?: string | null;
  syncCode?: string | null;
  deviceId?: string | null;
  installedCount: number;
  pendingCount: number;
  lastSyncAt?: string | null;
  lastEtag?: string | null;
  polling: boolean;
}

interface ActivityEntry {
  timestamp: string;
  message: string;
  level: string;
}

const DEFAULT_API_URL = "http://127.0.0.1:43123";

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  const [syncCode, setSyncCode] = useState("");
  const [status, setStatus] = useState<ClientStatus | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [nextStatus, nextActivity] = await Promise.all([
      invoke<ClientStatus>("get_status"),
      invoke<ActivityEntry[]>("get_activity"),
    ]);
    setStatus(nextStatus);
    setActivity(nextActivity);
  }

  useEffect(() => {
    void refresh();
    const unlistenPromise = listen("syncfont://tick", () => {
      void refresh();
    });
    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  async function handleConnect(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const nextStatus = await invoke<ClientStatus>("connect_library", {
        input: {
          apiBaseUrl,
          syncCode,
        },
      });
      setStatus(nextStatus);
      await refresh();
    } catch (connectError) {
      setError(String(connectError));
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncNow() {
    setBusy(true);
    setError(null);
    try {
      const nextStatus = await invoke<ClientStatus>("sync_now");
      setStatus(nextStatus);
      await refresh();
    } catch (syncError) {
      setError(String(syncError));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    setError(null);
    try {
      const nextStatus = await invoke<ClientStatus>("disconnect");
      setStatus(nextStatus);
      setActivity([]);
    } catch (disconnectError) {
      setError(String(disconnectError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">syncFont desktop client</p>
        <h1>Auto-install fonts from your library</h1>
        <p className="lede">
          Enter your sync code once. The client downloads new fonts from the API
          and installs them to your Mac every 30 seconds.
        </p>
      </header>

      {!status?.connected ? (
        <form className="panel" onSubmit={handleConnect}>
          <label>
            API URL
            <input
              value={apiBaseUrl}
              onChange={(event) => setApiBaseUrl(event.target.value)}
              placeholder="http://127.0.0.1:43123"
            />
          </label>
          <label>
            Sync code
            <input
              value={syncCode}
              onChange={(event) => setSyncCode(event.target.value.toUpperCase())}
              placeholder="FONT-ABCD-1234"
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Connecting…" : "Connect and install"}
          </button>
        </form>
      ) : (
        <section className="panel status-panel">
          <div className="status-grid">
            <div>
              <span className="label">Library</span>
              <strong>{status.libraryName}</strong>
            </div>
            <div>
              <span className="label">Installed</span>
              <strong>{status.installedCount}</strong>
            </div>
            <div>
              <span className="label">Polling</span>
              <strong>{status.polling ? "Every 30s" : "Off"}</strong>
            </div>
            <div>
              <span className="label">Last sync</span>
              <strong>{status.lastSyncAt ?? "Not yet"}</strong>
            </div>
          </div>
          <div className="actions">
            <button type="button" onClick={handleSyncNow} disabled={busy}>
              Sync now
            </button>
            <button
              type="button"
              className="secondary"
              onClick={handleDisconnect}
              disabled={busy}
            >
              Disconnect
            </button>
          </div>
        </section>
      )}

      {error ? <p className="error">{error}</p> : null}

      <section className="panel">
        <div className="panel-header">
          <h2>Activity</h2>
          <button type="button" className="secondary" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        {activity.length === 0 ? (
          <p className="muted">No activity yet.</p>
        ) : (
          <ul className="activity-list">
            {activity.map((entry) => (
              <li key={`${entry.timestamp}-${entry.message}`} data-level={entry.level}>
                <time>{new Date(entry.timestamp).toLocaleString()}</time>
                <span>{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
