import { createContext, useContext, useState, useCallback } from "react";

export type UploadPhase = "idle" | "transferring" | "processing" | "done" | "error";

interface UploadState {
  phase: UploadPhase;
  pct: number;
  label: string;
  error: string;
  isMinimized: boolean;
}

interface UploadContextValue extends UploadState {
  notifyStart: (label: string) => void;
  notifyProgress: (pct: number) => void;
  notifyProcessing: () => void;
  notifyDone: () => void;
  notifyError: (msg: string) => void;
  minimize: () => void;
  dismiss: () => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

const INITIAL: UploadState = {
  phase: "idle",
  pct: 0,
  label: "",
  error: "",
  isMinimized: false,
};

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UploadState>(INITIAL);

  const notifyStart = useCallback((label: string) => {
    setState({ phase: "transferring", pct: 0, label, error: "", isMinimized: false });
  }, []);

  const notifyProgress = useCallback((pct: number) => {
    setState((s) => ({ ...s, pct, phase: "transferring" }));
  }, []);

  const notifyProcessing = useCallback(() => {
    setState((s) => ({ ...s, phase: "processing", pct: 100 }));
  }, []);

  const notifyDone = useCallback(() => {
    setState((s) => ({ ...s, phase: "done", pct: 100 }));
    setTimeout(() => setState(INITIAL), 5000);
  }, []);

  const notifyError = useCallback((msg: string) => {
    setState((s) => ({ ...s, phase: "error", error: msg }));
  }, []);

  const minimize = useCallback(() => {
    setState((s) => ({ ...s, isMinimized: true }));
  }, []);

  const dismiss = useCallback(() => {
    setState(INITIAL);
  }, []);

  return (
    <UploadContext.Provider
      value={{ ...state, notifyStart, notifyProgress, notifyProcessing, notifyDone, notifyError, minimize, dismiss }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadContext() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUploadContext must be used inside UploadProvider");
  return ctx;
}
