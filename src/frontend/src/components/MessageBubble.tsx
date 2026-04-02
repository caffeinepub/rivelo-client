import { Bot, User } from "lucide-react";
import type { Message } from "../lib/db";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  "data-ocid"?: string;
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

// Render list items with content-based keys to satisfy both useJsxKeyInIterable and noArrayIndexKey
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

function SimpleMarkdown({ content }: { content: string }) {
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
      elements.push(
        <pre
          key={elements.length}
          className="rounded-xl overflow-x-auto my-3 text-xs p-4"
          style={{
            background: "oklch(0.11 0.015 240)",
            border: "1px solid oklch(var(--border))",
            color: "oklch(0.88 0.02 240)",
            fontFamily: "'GeistMono', monospace",
          }}
        >
          {lang && (
            <div
              className="text-xs mb-2 font-medium"
              style={{ color: "oklch(var(--brand))" }}
            >
              {lang}
            </div>
          )}
          <code>{codeLines.join("\n")}</code>
        </pre>,
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
  "data-ocid": ocid,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div
        data-ocid={ocid}
        className="flex justify-end mb-3 animate-fade-in-up"
      >
        <div
          className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-sm px-4 py-3"
          style={{
            background: "oklch(var(--surface-2))",
            border: "1px solid oklch(var(--border))",
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
            background: "oklch(var(--brand) / 0.2)",
            color: "oklch(var(--brand))",
          }}
        >
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  const showThinking = isStreaming && !message.content;

  return (
    <div data-ocid={ocid} className="flex gap-2 mb-3 animate-fade-in-up">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: "oklch(var(--brand) / 0.15)",
          border: "1px solid oklch(var(--brand) / 0.3)",
        }}
      >
        <Bot className="w-3.5 h-3.5" style={{ color: "oklch(var(--brand))" }} />
      </div>
      <div
        className="flex-1 min-w-0 rounded-2xl rounded-tl-sm px-4 py-3"
        style={{
          background: "oklch(var(--surface-1))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        {showThinking ? (
          <div className="flex gap-1.5 items-center h-5">
            {[0, 1, 2].map((n) => (
              <span
                key={n}
                className="thinking-dot w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(var(--brand))" }}
              />
            ))}
          </div>
        ) : (
          <div className="prose-rivelo">
            <SimpleMarkdown content={message.content} />
            {isStreaming && (
              <span
                className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
                style={{ background: "oklch(var(--brand))" }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
