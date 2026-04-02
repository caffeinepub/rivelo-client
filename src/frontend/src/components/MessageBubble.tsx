import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import { Bot, User } from "lucide-react";
import type { Components } from "react-markdown";
import type { Message } from "../lib/db";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  "data-ocid"?: string;
}

const markdownComponents: Components = {
  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th
      className="px-3 py-2 text-left text-xs font-semibold"
      style={{
        background: "oklch(var(--surface-2))",
        border: "1px solid oklch(var(--border))",
        color: "oklch(var(--brand))",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="px-3 py-1.5"
      style={{
        border: "1px solid oklch(var(--border))",
        color: "oklch(var(--foreground))",
      }}
    >
      {children}
    </td>
  ),
  // Code
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            background: "oklch(var(--surface-2))",
            color: "oklch(var(--brand))",
            fontFamily: "'GeistMono', monospace",
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre
      className="rounded-xl overflow-hidden my-3 text-sm"
      style={{
        background: "oklch(0.11 0.015 240)",
        border: "1px solid oklch(var(--border))",
      }}
    >
      {children}
    </pre>
  ),
  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "oklch(var(--brand))" }}
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
  // Blockquote
  blockquote: ({ children }) => (
    <blockquote
      className="pl-4 my-2 italic"
      style={{
        borderLeft: "3px solid oklch(var(--brand))",
        color: "oklch(var(--muted-foreground))",
      }}
    >
      {children}
    </blockquote>
  ),
  // Lists
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-2 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-2 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="text-sm">{children}</li>,
  // Headings
  h1: ({ children }) => (
    <h1 className="text-lg font-semibold font-display mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold font-display mt-3 mb-1.5">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold font-display mt-2 mb-1">{children}</h3>
  ),
  // Paragraph
  p: ({ children }) => <p className="text-sm leading-6 mb-2">{children}</p>,
  // HR
  hr: () => (
    <hr style={{ borderColor: "oklch(var(--border))" }} className="my-3" />
  ),
  // Strong
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
};

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

  // Assistant message
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
            <span
              className="thinking-dot w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(var(--brand))" }}
            />
            <span
              className="thinking-dot w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(var(--brand))" }}
            />
            <span
              className="thinking-dot w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(var(--brand))" }}
            />
          </div>
        ) : (
          <div className="prose-rivelo">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
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
