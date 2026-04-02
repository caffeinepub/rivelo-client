import { Bot, ChevronDown, ChevronUp, Copy, Play, User } from "lucide-react";
import { useCallback, useState } from "react";
import type { Message } from "../lib/db";
import SandboxModal from "./SandboxModal";

interface CodeBlock {
  language: string;
  code: string;
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isThinking?: boolean;
  thinkingContent?: string;
  "data-ocid"?: string;
  onAddChip?: (tagName: string, outerHTML: string) => void;
}

const codeStyle: React.CSSProperties = {
  background: "oklch(var(--surface-2))",
  color: "oklch(var(--brand))",
  fontFamily: "'GeistMono', monospace",
};
const linkStyle: React.CSSProperties = { color: "oklch(var(--brand))" };

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    const cm = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
    if (cm) {
      if (cm[1]) parts.push(<span key={k++}>{cm[1]}</span>);
      parts.push(
        <code
          key={k++}
          className="px-1.5 py-0.5 rounded text-xs"
          style={codeStyle}
        >
          {cm[2]}
        </code>,
      );
      remaining = cm[3];
      continue;
    }
    const bm = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/s);
    if (bm) {
      if (bm[1]) parts.push(<span key={k++}>{bm[1]}</span>);
      parts.push(
        <strong key={k++} className="font-semibold">
          {bm[2]}
        </strong>,
      );
      remaining = bm[3];
      continue;
    }
    const lm = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/s);
    if (lm) {
      if (lm[1]) parts.push(<span key={k++}>{lm[1]}</span>);
      parts.push(
        <a
          key={k++}
          href={lm[3]}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          className="underline underline-offset-2"
        >
          {lm[2]}
        </a>,
      );
      remaining = lm[4];
      continue;
    }
    const im = remaining.match(/^(.*?)[*_]([^*_]+)[*_](.*)$/s);
    if (im) {
      if (im[1]) parts.push(<span key={k++}>{im[1]}</span>);
      parts.push(<em key={k++}>{im[2]}</em>);
      remaining = im[3];
      continue;
    }
    parts.push(<span key={k++}>{remaining}</span>);
    break;
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function renderLiNodes(
  items: string[],
  fgStyle: React.CSSProperties,
  ordered: boolean,
): React.ReactNode {
  const Tag = ordered ? "ol" : "ul";
  const cls = ordered
    ? "list-decimal pl-5 my-2 space-y-0.5"
    : "list-disc pl-5 my-2 space-y-0.5";
  return (
    <Tag className={cls}>
      {items.map((item, n) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: markdown list has no stable IDs
        <li key={n} className="text-sm" style={fgStyle}>
          {parseInline(item)}
        </li>
      ))}
    </Tag>
  );
}

function renderQuoteNodes(
  lines: string[],
  mutedStyle: React.CSSProperties,
): React.ReactNode {
  return (
    <blockquote
      className="pl-4 my-2 italic"
      style={{ borderLeft: "3px solid oklch(var(--brand))", ...mutedStyle }}
    >
      {lines.map((l, n) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: markdown lines have no stable IDs
        <p key={n} className="text-sm">
          {parseInline(l)}
        </p>
      ))}
    </blockquote>
  );
}

function renderTableNode(
  headers: string[],
  rows: string[][],
  thStyle: React.CSSProperties,
  tdStyle: React.CSSProperties,
): React.ReactNode {
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-xs font-semibold"
                style={thStyle}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rn) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: table rows static
            <tr key={rn}>
              {row.map((cell, cn) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: table cells static
                <td key={cn} className="px-3 py-1.5" style={tdStyle}>
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlockWithActions({
  language,
  code,
  allBlocks,
  onAddChip,
}: {
  language: string;
  code: string;
  allBlocks: CodeBlock[];
  onAddChip?: (tagName: string, outerHTML: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const fgStyle: React.CSSProperties = { color: "oklch(var(--foreground))" };

  return (
    <>
      <div
        className="rounded-xl overflow-hidden my-3"
        style={{
          background: "oklch(0.96 0.02 260)",
          border: "1px solid oklch(var(--border))",
        }}
      >
        {/* Code block header */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background: "oklch(0.94 0.02 260)",
            borderBottom: "1px solid oklch(var(--border))",
          }}
        >
          <span
            className="text-xs font-semibold font-mono"
            style={{ color: "oklch(var(--brand))" }}
          >
            {language || "code"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-ocid="code.copy.button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                background: copied
                  ? "oklch(var(--success) / 0.15)"
                  : "oklch(var(--surface-2))",
                color: copied
                  ? "oklch(var(--success))"
                  : "oklch(var(--muted-foreground))",
                border: `1px solid ${copied ? "oklch(var(--success) / 0.3)" : "oklch(var(--border))"}`,
              }}
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              data-ocid="code.sandbox.button"
              onClick={() => setSandboxOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                background: "oklch(var(--brand) / 0.1)",
                color: "oklch(var(--brand))",
                border: "1px solid oklch(var(--brand) / 0.3)",
              }}
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          </div>
        </div>
        <pre
          className="overflow-x-auto p-4 text-xs"
          style={{
            ...fgStyle,
            fontFamily: "'GeistMono', monospace",
            lineHeight: 1.7,
          }}
        >
          <code>{code}</code>
        </pre>
      </div>

      {sandboxOpen && (
        <SandboxModal
          code={code}
          language={language}
          allBlocks={allBlocks}
          onSelectElement={(tagName, outerHTML) => {
            if (onAddChip) onAddChip(tagName, outerHTML);
          }}
          onClose={() => setSandboxOpen(false)}
        />
      )}
    </>
  );
}

function ThinkingBlock({
  content,
  isActive,
  durationSecs,
}: {
  content: string;
  isActive: boolean;
  durationSecs?: number;
}) {
  const [expanded, setExpanded] = useState(isActive);

  return (
    <div
      className="mb-3 rounded-xl overflow-hidden"
      style={{
        border: "1px solid oklch(var(--border))",
        background: "oklch(var(--surface-2))",
      }}
    >
      <button
        type="button"
        data-ocid="message.thinking.toggle"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-2.5"
      >
        {isActive ? (
          <span className="flex gap-1">
            {[0, 1, 2].map((n) => (
              <span
                key={n}
                className="thinking-dot w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(var(--brand))" }}
              />
            ))}
          </span>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="oklch(var(--muted-foreground))"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )}
        <span
          className="text-xs font-semibold font-display"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          {isActive
            ? "Thinking..."
            : `Thought${durationSecs ? ` for ${durationSecs}s` : ""}`}
        </span>
        <div className="flex-1" />
        {expanded ? (
          <ChevronUp
            className="w-3.5 h-3.5"
            style={{ color: "oklch(var(--muted-foreground))" }}
          />
        ) : (
          <ChevronDown
            className="w-3.5 h-3.5"
            style={{ color: "oklch(var(--muted-foreground))" }}
          />
        )}
      </button>
      {expanded && (
        <div
          className="px-4 pb-3"
          style={{ borderTop: "1px solid oklch(var(--border))" }}
        >
          <div className="thinking-block mt-2">{content || "..."}</div>
        </div>
      )}
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className="text-xs font-medium animate-pulse-soft"
        style={{ color: "oklch(var(--muted-foreground))" }}
      >
        Loading
      </span>
      <div className="flex gap-1.5 items-center">
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className="thinking-dot w-1.5 h-1.5 rounded-full"
            style={{ background: "oklch(var(--brand) / 0.6)" }}
          />
        ))}
      </div>
    </div>
  );
}

function SimpleMarkdown({
  content,
  onAddChip,
}: {
  content: string;
  onAddChip?: (tagName: string, outerHTML: string) => void;
}) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  const fgStyle: React.CSSProperties = { color: "oklch(var(--foreground))" };
  const mutedStyle: React.CSSProperties = {
    color: "oklch(var(--muted-foreground))",
  };
  const thStyle: React.CSSProperties = {
    background: "oklch(var(--surface-2))",
    border: "1px solid oklch(var(--border))",
    color: "oklch(var(--brand))",
  };
  const tdStyle: React.CSSProperties = {
    border: "1px solid oklch(var(--border))",
    color: "oklch(var(--foreground))",
  };
  let i = 0;

  // First pass: collect all code blocks in this message
  const allCodeBlocks: CodeBlock[] = [];
  let tempI = 0;
  while (tempI < lines.length) {
    if (lines[tempI].startsWith("```")) {
      const lang = lines[tempI].slice(3).trim();
      const codeLines: string[] = [];
      tempI++;
      while (tempI < lines.length && !lines[tempI].startsWith("```")) {
        codeLines.push(lines[tempI]);
        tempI++;
      }
      allCodeBlocks.push({ language: lang, code: codeLines.join("\n") });
    }
    tempI++;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeStr = codeLines.join("\n");
      elements.push(
        <CodeBlockWithActions
          key={elements.length}
          language={lang}
          code={codeStr}
          allBlocks={allCodeBlocks}
          onAddChip={onAddChip}
        />,
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <div key={elements.length}>
          {renderQuoteNodes(quoteLines, mutedStyle)}
        </div>,
      );
      continue;
    }

    // Headings
    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      elements.push(
        <h1
          key={elements.length}
          className="text-lg font-semibold font-display mt-4 mb-2"
          style={fgStyle}
        >
          {parseInline(h1[1])}
        </h1>,
      );
      i++;
      continue;
    }
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      elements.push(
        <h2
          key={elements.length}
          className="text-base font-semibold font-display mt-3 mb-1.5"
          style={fgStyle}
        >
          {parseInline(h2[1])}
        </h2>,
      );
      i++;
      continue;
    }
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      elements.push(
        <h3
          key={elements.length}
          className="text-sm font-semibold font-display mt-2 mb-1"
          style={fgStyle}
        >
          {parseInline(h3[1])}
        </h3>,
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*+] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*+] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <div key={elements.length}>{renderLiNodes(items, fgStyle, false)}</div>,
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <div key={elements.length}>{renderLiNodes(items, fgStyle, true)}</div>,
      );
      continue;
    }

    // HR
    if (line.match(/^[-*_]{3,}$/)) {
      elements.push(
        <hr
          key={elements.length}
          style={{ borderColor: "oklch(var(--border))" }}
          className="my-3"
        />,
      );
      i++;
      continue;
    }

    // Table
    if (line.includes("|") && lines[i + 1]?.match(/^[|\s:-]+$/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0]
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      const rows = tableLines.slice(2).map((row) =>
        row
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean),
      );
      elements.push(
        <div key={elements.length}>
          {renderTableNode(headers, rows, thStyle, tdStyle)}
        </div>,
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("> ") &&
      !lines[i].match(/^[-*+] /) &&
      !lines[i].match(/^\d+\. /)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    elements.push(
      <p
        key={elements.length}
        className="text-sm leading-6 mb-2"
        style={fgStyle}
      >
        {parseInline(paraLines.join(" "))}
      </p>,
    );
  }

  return <>{elements}</>;
}

export default function MessageBubble({
  message,
  isStreaming,
  isThinking,
  thinkingContent,
  "data-ocid": ocid,
  onAddChip,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div
        data-ocid={ocid}
        className="flex justify-end mb-4 animate-fade-in-up"
      >
        <div
          className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-sm px-4 py-3"
          style={{
            background: "oklch(var(--brand) / 0.1)",
            border: "1px solid oklch(var(--brand) / 0.2)",
          }}
        >
          <p
            className="text-sm leading-6 whitespace-pre-wrap"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {message.content}
          </p>
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ml-2 shrink-0 mt-0.5"
          style={{
            background: "oklch(var(--brand) / 0.15)",
            color: "oklch(var(--brand))",
          }}
        >
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // Loading state: no content yet, first chunk not arrived
  const showLoading =
    isStreaming && isThinking && !thinkingContent && !message.content;

  return (
    <div data-ocid={ocid} className="flex gap-2 mb-4 animate-fade-in-up">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: "oklch(var(--brand) / 0.12)",
          border: "1px solid oklch(var(--brand) / 0.25)",
        }}
      >
        <Bot className="w-3.5 h-3.5" style={{ color: "oklch(var(--brand))" }} />
      </div>
      <div className="flex-1 min-w-0">
        {showLoading && (
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3"
            style={{
              background: "oklch(var(--surface-1))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <LoadingIndicator />
          </div>
        )}

        {!showLoading && (
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3"
            style={{
              background: "oklch(var(--surface-1))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            {/* Thinking block */}
            {(thinkingContent || (isThinking && isStreaming)) && (
              <ThinkingBlock
                content={thinkingContent || ""}
                isActive={!!isThinking && !!isStreaming}
              />
            )}

            {/* Main content */}
            {message.content ? (
              <div className="prose-rivelo">
                <SimpleMarkdown
                  content={message.content}
                  onAddChip={onAddChip}
                />
                {isStreaming && !isThinking && (
                  <span
                    className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
                    style={{ background: "oklch(var(--brand))" }}
                  />
                )}
              </div>
            ) : (
              isStreaming &&
              !isThinking && (
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className="thinking-dot w-1.5 h-1.5 rounded-full"
                      style={{ background: "oklch(var(--brand))" }}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
