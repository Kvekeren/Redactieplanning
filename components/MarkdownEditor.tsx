"use client";

import { useEffect, useRef, useState } from "react";
import TurndownService from "turndown";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
  /** Namen voor de "Opmerking als" dropdown. Als gezet, wordt een helper getoond om **Naam:** in te voegen. */
  authorOptions?: readonly string[];
}

const turndown = new TurndownService({ headingStyle: "atx" });

marked.use({
  hooks: {
    postprocess(html: string) {
      return html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
    },
  },
});

function markdownToHtml(md: string): string {
  if (!md.trim()) return "";
  const raw = marked.parse(md) as string;
  return DOMPurify.sanitize(raw);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Typ hier… Gebruik ⌘B voor vet, ⌘I voor cursief, etc.",
  minRows = 4,
  className = "",
  authorOptions,
}: MarkdownEditorProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const skipNextSyncRef = useRef(false);

  // Sync value prop naar contenteditable (bijv. bij wisselen van artikel)
  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const el = divRef.current;
    if (!el) return;
    const html = markdownToHtml(value);
    const safeHtml = html || "<p><br></p>";
    if (el.innerHTML !== safeHtml) {
      el.innerHTML = safeHtml;
      if (!html) el.querySelector("p")?.focus();
    }
  }, [value]);

  const syncToMarkdown = () => {
    const el = divRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const isEmpty =
      html === "<p><br></p>" ||
      html === "<p></p>" ||
      !el.textContent?.trim();
    if (isEmpty) {
      if (value !== "") {
        skipNextSyncRef.current = true;
        onChange("");
      }
      return;
    }
    try {
      const md = turndown.turndown(html)?.trim() ?? "";
      if (md !== value) {
        skipNextSyncRef.current = true;
        onChange(md);
      }
    } catch {
      // Bij parsefouten: negeer
    }
  };

  const handleInput = () => {
    syncToMarkdown();
  };

  const [authorSelect, setAuthorSelect] = useState("");

  const insertAuthorAtCursor = (naam: string) => {
    const el = divRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    const html = `<strong>${escapeHtml(naam)}:</strong> `;
    document.execCommand("insertHTML", false, html);
    syncToMarkdown();
    setAuthorSelect("");
  };

  const getTextBeforeCursorInBlock = (): string => {
    const sel = window.getSelection();
    const el = divRef.current;
    if (!sel || sel.rangeCount === 0 || !el) return "";
    const range = sel.getRangeAt(0);
    let block: Element | null = range.startContainer as Element;
    if (block.nodeType === Node.TEXT_NODE) block = block.parentElement;
    if (!block) return "";
    while (block && block !== el) {
      const tag = block.tagName;
      if (["P", "LI", "DIV", "H1", "H2", "H3", "PRE", "BLOCKQUOTE"].includes(tag)) break;
      block = block.parentElement;
    }
    if (!block || block === el) return "";
    const blockRange = document.createRange();
    blockRange.selectNodeContents(block);
    blockRange.setEnd(range.startContainer, range.startOffset);
    return blockRange.toString();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;

    // Enter in blockquote: nieuwe regel wordt normale paragraaf
    if (e.key === "Enter" && !e.shiftKey && divRef.current) {
      let node: Element | null = window.getSelection()?.anchorNode as Element;
      if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
      while (node && node !== divRef.current) {
        if (node.tagName === "BLOCKQUOTE") {
          e.preventDefault();
          document.execCommand("insertParagraph");
          document.execCommand("outdent");
          syncToMarkdown();
          return;
        }
        node = node.parentElement;
      }
    }

    // Tab/Shift+Tab: indent/outdent in lijsten
    if (e.key === "Tab") {
      const sel = window.getSelection();
      const el = divRef.current;
      if (sel && sel.rangeCount > 0 && el) {
        let node: Element | null = sel.anchorNode as Element;
        if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
        while (node && node !== el) {
          if (node.tagName === "LI") {
            e.preventDefault();
            document.execCommand(e.shiftKey ? "outdent" : "indent");
            syncToMarkdown();
            return;
          }
          node = node.parentElement;
        }
      }
    }

    // Bij spatie: check voor "- ", "* ", "1. " of ">" aan begin van regel
    if (e.key === " " && !mod) {
      const before = getTextBeforeCursorInBlock();
      const blockquoteMatch = /^>$/.test(before);
      const bulletMatch = /^(-|\*)$/.test(before);
      const orderedMatch = /^\d+\.$/.test(before);
      if (blockquoteMatch) {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          let block: Element | null = range.startContainer as Element;
          if (block.nodeType === Node.TEXT_NODE) block = block.parentElement;
          while (block && block !== divRef.current) {
            if (["P", "LI", "DIV", "H1", "H2", "H3", "PRE", "BLOCKQUOTE"].includes(block.tagName)) break;
            block = block.parentElement;
          }
          if (block && block !== divRef.current) {
            const delRange = document.createRange();
            delRange.setStart(block, 0);
            delRange.setEnd(range.startContainer, range.startOffset);
            delRange.deleteContents();
            document.execCommand("formatBlock", false, "blockquote");
            document.execCommand("insertText", false, " ");
            syncToMarkdown();
          }
        }
        return;
      }
      if (bulletMatch || orderedMatch) {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          let block: Element | null = range.startContainer as Element;
          if (block.nodeType === Node.TEXT_NODE) block = block.parentElement;
          while (block && block !== divRef.current) {
            if (["P", "LI", "DIV", "H1", "H2", "H3", "PRE", "BLOCKQUOTE"].includes(block.tagName)) break;
            block = block.parentElement;
          }
          if (block && block !== divRef.current) {
            const delRange = document.createRange();
            delRange.setStart(block, 0);
            delRange.setEnd(range.startContainer, range.startOffset);
            delRange.deleteContents();
            document.execCommand(bulletMatch ? "insertUnorderedList" : "insertOrderedList");
          }
        }
        return;
      }
    }

    if (mod && ["b", "i", "k", "1", "2", "3", "l", "c"].includes(e.key.toLowerCase())) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        document.execCommand("bold");
        return;
      }
      if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        document.execCommand("italic");
        return;
      }
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        const url = prompt("URL:");
        if (url) document.execCommand("createLink", false, url);
        return;
      }
      if (["1", "2", "3"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        const level = parseInt(e.key, 10);
        document.execCommand("formatBlock", false, `h${level}`);
        syncToMarkdown();
        return;
      }
      if (e.key.toLowerCase() === "l" && e.shiftKey) {
        e.preventDefault();
        document.execCommand("insertUnorderedList");
        return;
      }
      if (e.key.toLowerCase() === "c" && e.shiftKey) {
        e.preventDefault();
        document.execCommand("formatBlock", false, "pre");
        return;
      }
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {authorOptions && authorOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="opmerking-als" className="text-xs font-medium text-gray-600">
            Opmerking als:
          </label>
          <select
            id="opmerking-als"
            value={authorSelect}
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                insertAuthorAtCursor(v);
              }
            }}
            className="rounded-lg border border-gray-200/80 bg-white px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
          >
            <option value="">— kies —</option>
            {authorOptions.map((naam) => (
              <option key={naam} value={naam}>
                {naam}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            const el = divRef.current;
            if (!el?.textContent?.trim()) return;
            try {
              const md = turndown.turndown(el.innerHTML)?.trim() ?? "";
              if (md) navigator.clipboard.writeText(md);
            } catch {
              if (value.trim()) navigator.clipboard.writeText(value);
            }
          }}
          title="Kopiëren"
          className="absolute right-2 top-2 z-20 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Kopiëren"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        {!value && (
          <div
            className="pointer-events-none absolute inset-0 px-3 py-2 text-sm text-gray-400"
            aria-hidden
          >
            {placeholder}
          </div>
        )}
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={syncToMarkdown}
          onClick={(e) => {
            const link = (e.target as HTMLElement).closest("a[href]");
            if (link && link instanceof HTMLAnchorElement && link.href) {
              window.open(link.href, "_blank", "noopener,noreferrer");
              e.preventDefault();
            }
          }}
          className="markdown-editor relative z-10 min-h-[120px] rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer [&_a]:hover:text-blue-800 [&_a]:break-words [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_pre]:rounded [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:text-gray-600"
        />
      </div>
    </div>
  );
}
