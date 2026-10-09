import { useEffect, useState } from "react";
import type { Status } from "../../lib/api/types";
import { statusExtraLine, statusStyle } from "../../lib/presentation/status";

interface Props {
  initial: Status | null;
}

const POLL_MS = 60_000;

export default function StatusPanel({ initial }: Props) {
  const [status, setStatus] = useState<Status | null>(initial);
  const [failed, setFailed] = useState(initial === null);

  useEffect(() => {
    let timer: number | undefined;
    let controller: AbortController | undefined;

    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/status.json", { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(String(response.status));
        setStatus((await response.json()) as Status);
        setFailed(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setFailed(true);
      }
    }

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(refresh, POLL_MS);
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void refresh();
        start();
      }
    };

    if (initial === null) void refresh();
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initial]);

  if (!status) {
    return (
      <p role="status" className="text-sm text-steam-muted">
        {failed ? "Unable to load status." : "Loading status..."}
      </p>
    );
  }

  const { label, colour } = statusStyle(status.kind);
  const extra = statusExtraLine(status);

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <p className="flex items-center gap-2 text-lg font-light" style={{ color: colour }}>
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colour }} />
        Currently {label}
      </p>
      {extra && (
        <p className="mt-1 text-sm break-words" style={{ color: status.kind === "working" ? colour : undefined }}>
          {extra}
        </p>
      )}
      {failed && <p className="mt-1 text-[11px] text-steam-muted">Status may be out of date.</p>}
    </div>
  );
}
