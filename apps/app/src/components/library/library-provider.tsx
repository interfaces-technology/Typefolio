"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiError,
  getMe,
  listActivity,
  listCollections,
  listDevices,
  listFamilies,
  listReferences,
} from "@typefolio/core/api";
import type {
  ActivityEvent,
  CollectionSummary,
  Device,
  Entitlement,
  FontFamilyGroup,
  LibrarySummary,
  ReferenceRecord,
} from "@typefolio/core/types";

type Status = "idle" | "loading" | "success" | "error";

interface LibraryContextValue {
  status: Status;
  error: string | null;
  offline: boolean;
  library: LibrarySummary | null;
  entitlement: Entitlement | null;
  families: FontFamilyGroup[];
  collections: CollectionSummary[];
  references: ReferenceRecord[];
  devices: Device[];
  activity: ActivityEvent[];
  refresh: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [library, setLibrary] = useState<LibrarySummary | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [families, setFamilies] = useState<FontFamilyGroup[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [references, setReferences] = useState<ReferenceRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  const refresh = useCallback(async () => {
    setStatus((current) => (current === "success" ? current : "loading"));
    try {
      const me = await getMe();
      const [familyResult, collectionResult, referenceResult, deviceResult, activityResult] =
        await Promise.all([
          listFamilies(me.library.id, { sort: "newest" }),
          listCollections(me.library.id),
          listReferences(me.library.id),
          listDevices(me.library.id),
          listActivity(me.library.id),
        ]);
      setLibrary(me.library);
      setEntitlement(me.entitlement);
      setFamilies(familyResult.families);
      setCollections(collectionResult.collections);
      setReferences(referenceResult.references);
      setDevices(deviceResult.devices);
      setActivity(activityResult.activity);
      setError(null);
      setStatus("success");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We couldn't load your library.",
      );
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const value = useMemo(
    () => ({
      status,
      error,
      offline,
      library,
      entitlement,
      families,
      collections,
      references,
      devices,
      activity,
      refresh,
    }),
    [
      status,
      error,
      offline,
      library,
      entitlement,
      families,
      collections,
      references,
      devices,
      activity,
      refresh,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used inside LibraryProvider");
  }
  return context;
}
