import * as React from "react";

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    // ignore
  }
  document.body.removeChild(textarea);
  return success;
}

export function useCopyToClipboard<TContext = void>({
  timeout = 2000,
  onCopy,
  onError,
}: {
  timeout?: number;
  onCopy?: (ctx: TContext) => void;
  onError?: (error: Error, ctx: TContext) => void;
} = {}): { copyToClipboard: (value: string, ctx: TContext) => void; isCopied: boolean } {
  const [isCopied, setIsCopied] = React.useState(false);
  const timeoutIdRef = React.useRef<NodeJS.Timeout | null>(null);
  const onCopyRef = React.useRef(onCopy);
  const onErrorRef = React.useRef(onError);
  const timeoutRef = React.useRef(timeout);

  onCopyRef.current = onCopy;
  onErrorRef.current = onError;
  timeoutRef.current = timeout;

  const copyToClipboard = React.useCallback((value: string, ctx: TContext): void => {
    if (typeof window === "undefined") {
      onErrorRef.current?.(new Error("Clipboard API unavailable."), ctx);
      return;
    }

    if (!value) return;

    const onSuccess = (): void => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      setIsCopied(true);
      onCopyRef.current?.(ctx);
      if (timeoutRef.current !== 0) {
        timeoutIdRef.current = setTimeout(() => {
          setIsCopied(false);
          timeoutIdRef.current = null;
        }, timeoutRef.current);
      }
    };

    const onFailure = (error: Error): void => {
      if (onErrorRef.current) {
        onErrorRef.current(error, ctx);
      } else {
        console.error(error);
      }
    };

    // Prefer the async Clipboard API, fall back to execCommand for HTTP origins
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(onSuccess, (error) => {
        // If the async API fails (e.g. non-secure context on HTTP),
        // try the fallback before giving up.
        if (fallbackCopy(value)) {
          onSuccess();
        } else {
          onFailure(error instanceof Error ? error : new Error(String(error)));
        }
      });
    } else if (fallbackCopy(value)) {
      onSuccess();
    } else {
      onFailure(new Error("Clipboard API unavailable."));
    }
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return (): void => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return { copyToClipboard, isCopied };
}
