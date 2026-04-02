import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SandboxModalProps {
  code: string;
  language: string;
  allBlocks?: Array<{ language: string; code: string }>;
  onSelectElement: (tagName: string, outerHTML: string) => void;
  onClose: () => void;
}

function mergeBlocks(
  blocks: Array<{ language: string; code: string }>,
): string {
  const htmlBlock = blocks.find(
    (b) => b.language === "html" || b.language === "",
  );
  const cssBlock = blocks.find((b) => b.language === "css");
  const jsBlock = blocks.find(
    (b) =>
      b.language === "js" ||
      b.language === "javascript" ||
      b.language === "typescript" ||
      b.language === "ts",
  );

  if (htmlBlock) {
    let html = htmlBlock.code;
    if (cssBlock && !html.includes("</head>")) {
      html = `<!DOCTYPE html><html><head><style>${cssBlock.code}</style></head><body>${html}</body></html>`;
    } else if (cssBlock) {
      html = html.replace("</head>", `<style>${cssBlock.code}</style></head>`);
    }
    if (jsBlock) {
      html = html.replace(
        "</body>",
        `<script>${jsBlock.code}<\/script></body>`,
      );
    }
    return html;
  }

  if (cssBlock || jsBlock) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${cssBlock?.code ?? ""}</style></head><body>${jsBlock ? `<script>${jsBlock.code}<\/script>` : ""}</body></html>`;
  }

  const lang = blocks[0]?.language ?? "";
  const raw = blocks[0]?.code ?? "";
  if (lang === "html") return raw;
  if (lang === "css")
    return `<!DOCTYPE html><html><head><style>${raw}</style></head><body></body></html>`;
  return `<!DOCTYPE html><html><head></head><body><script>${raw}<\/script></body></html>`;
}

function injectInspector(html: string): string {
  const inspectorScript = `
<script>
(function(){
  function highlight(el) {
    el.style.outline = '2px solid rgba(37,101,243,0.8)';
    el.style.outlineOffset = '2px';
  }
  function unhighlight(el) {
    el.style.outline = '';
    el.style.outlineOffset = '';
  }
  document.addEventListener('mouseover', function(e) {
    highlight(e.target);
  }, true);
  document.addEventListener('mouseout', function(e) {
    unhighlight(e.target);
  }, true);
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var el = e.target;
    var tagName = el.tagName.toLowerCase();
    var outer = el.outerHTML.slice(0, 500);
    window.parent.postMessage({ type: 'element-selected', tagName: tagName, outerHTML: outer }, '*');
  }, true);
})();
<\/script>`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${inspectorScript}</body>`);
  }
  return html + inspectorScript;
}

function PublishPopover({
  html,
  onClose,
}: { html: string; onClose: () => void }) {
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState("");

  const handlePublish = () => {
    const s = slug
      .trim()
      .replace(/[^a-z0-9-]/gi, "-")
      .toLowerCase();
    if (!s) return;
    try {
      const map = JSON.parse(localStorage.getItem("rivelo_sandboxes") || "{}");
      map[s] = html;
      localStorage.setItem("rivelo_sandboxes", JSON.stringify(map));
      setPublishedSlug(s);
      setPublished(true);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="absolute top-12 right-32 z-50 rounded-xl shadow-card p-4 w-72"
      style={{
        background: "oklch(var(--surface-1))",
        border: "1px solid oklch(var(--border))",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm font-semibold font-display"
          style={{ color: "oklch(var(--foreground))" }}
        >
          Publish Sandbox
        </span>
        <button type="button" onClick={onClose}>
          <X
            className="w-4 h-4"
            style={{ color: "oklch(var(--muted-foreground))" }}
          />
        </button>
      </div>
      {published ? (
        <div>
          <p
            className="text-xs mb-2"
            style={{ color: "oklch(var(--success))" }}
          >
            Published!
          </p>
          <p
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              background: "oklch(var(--surface-2))",
              color: "oklch(var(--brand))",
            }}
          >
            #sandbox/{publishedSlug}
          </p>
          <p
            className="text-xs mt-2"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Saved locally. Share via URL hash.
          </p>
        </div>
      ) : (
        <>
          <p
            className="text-xs mb-2"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Choose a slug for your sandbox URL
          </p>
          <input
            data-ocid="sandbox.publish.input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePublish()}
            placeholder="my-project"
            className="w-full px-3 py-2 text-sm rounded-lg outline-none mb-3"
            style={{
              background: "oklch(var(--surface-2))",
              border: "1px solid oklch(var(--border))",
              color: "oklch(var(--foreground))",
              fontFamily: "GeistMono, monospace",
            }}
          />
          <button
            type="button"
            data-ocid="sandbox.publish.button"
            onClick={handlePublish}
            disabled={!slug.trim()}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: slug.trim()
                ? "oklch(var(--brand))"
                : "oklch(var(--surface-3))",
              color: slug.trim() ? "white" : "oklch(var(--muted-foreground))",
            }}
          >
            Publish
          </button>
        </>
      )}
    </div>
  );
}

export default function SandboxModal({
  code,
  language,
  allBlocks,
  onSelectElement,
  onClose,
}: SandboxModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [showPublish, setShowPublish] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const blocks = allBlocks ?? [{ language, code }];
  const mergedHtml = mergeBlocks(blocks);

  const loadSandbox = useCallback((html: string, withInspect: boolean) => {
    setStatus("loading");
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const finalHtml = withInspect ? injectInspector(html) : html;
    const blob = new Blob([finalHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload when reloadKey changes
  useEffect(() => {
    loadSandbox(mergedHtml, inspectMode);
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [reloadKey, inspectMode, loadSandbox]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "element-selected" && inspectMode) {
        onSelectElement(e.data.tagName as string, e.data.outerHTML as string);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [inspectMode, onSelectElement]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "oklch(var(--surface-0))" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0 relative"
        style={{
          background: "oklch(var(--surface-1))",
          borderBottom: "1px solid oklch(var(--border))",
        }}
      >
        <span
          className="font-display font-semibold text-sm"
          style={{ color: "oklch(var(--foreground))" }}
        >
          Sandbox
        </span>
        <div className="flex-1" />

        {/* Reload */}
        <button
          type="button"
          data-ocid="sandbox.reload.button"
          onClick={() => setReloadKey((k) => k + 1)}
          title="Reload sandbox"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: "oklch(var(--surface-2))",
            color: "oklch(var(--foreground))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <ReloadIcon />
          Reload
        </button>

        {/* Inspect */}
        <button
          type="button"
          data-ocid="sandbox.inspect.toggle"
          onClick={() => setInspectMode((v) => !v)}
          title="Inspect elements"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: inspectMode
              ? "oklch(var(--brand))"
              : "oklch(var(--surface-2))",
            color: inspectMode ? "white" : "oklch(var(--foreground))",
            border: `1px solid ${inspectMode ? "oklch(var(--brand))" : "oklch(var(--border))"}`,
          }}
        >
          <InspectIcon />
          {inspectMode ? "Inspecting" : "Inspect"}
        </button>

        {/* Publish */}
        <button
          type="button"
          data-ocid="sandbox.publish.open_modal_button"
          onClick={() => setShowPublish((v) => !v)}
          title="Publish sandbox"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: "oklch(var(--surface-2))",
            color: "oklch(var(--foreground))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <PublishIcon />
          Publish
        </button>

        {/* Close */}
        <button
          type="button"
          data-ocid="sandbox.close.button"
          onClick={onClose}
          className="p-2 rounded-lg transition-colors"
          style={{
            color: "oklch(var(--muted-foreground))",
            background: "oklch(var(--surface-2))",
          }}
        >
          <X className="w-4 h-4" />
        </button>

        {showPublish && (
          <PublishPopover
            html={mergedHtml}
            onClose={() => setShowPublish(false)}
          />
        )}
      </div>

      {/* Inspector hint */}
      {inspectMode && (
        <div
          className="px-4 py-2 text-xs shrink-0"
          style={{
            background: "oklch(var(--brand) / 0.08)",
            borderBottom: "1px solid oklch(var(--brand) / 0.2)",
            color: "oklch(var(--brand))",
          }}
        >
          Click any element in the sandbox to add it to the chat input
        </div>
      )}

      {/* Iframe body */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Sandbox"
          className="sandbox-frame"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "white",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          onLoad={() => setStatus("ready")}
        />
      </div>

      {/* Footer status */}
      <div
        className="flex items-center gap-2 px-4 py-2 shrink-0"
        style={{
          background: "oklch(var(--surface-1))",
          borderTop: "1px solid oklch(var(--border))",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background:
              status === "ready"
                ? "oklch(var(--success))"
                : "oklch(var(--brand))",
          }}
        />
        <span
          className="text-xs"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          {status === "ready" ? "Ready" : "Loading..."}
        </span>
        {inspectMode && (
          <span
            className="ml-auto text-xs font-medium"
            style={{ color: "oklch(var(--brand))" }}
          >
            Inspector active — click elements to add to chat
          </span>
        )}
      </div>
    </div>
  );
}

function ReloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function InspectIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 11l4.5 11 2-5 5-2L11 11z" />
      <path d="M7.5 7.5L3 3" />
      <path d="M7 13.5L3 17" />
      <path d="M13.5 7L17 3" />
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
