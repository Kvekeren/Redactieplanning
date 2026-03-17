"use client";

import { useEffect, useRef } from "react";
import TurndownService from "turndown";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
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

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Typ hier… Gebruik ⌘B voor vet, ⌘I voor cursief, etc.",
  minRows = 4,
  className = "",
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
      if (["P", "LI", "DIV", "H1", "H2", "H3", "PRE"].includes(tag)) break;
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

    // Bij spatie: check voor "- ", "* " of "1. " aan begin van regel → maak lijst
    if (e.key === " " && !mod) {
      const before = getTextBeforeCursorInBlock();
      const bulletMatch = /^(-|\*)$/.test(before);
      const orderedMatch = /^\d+\.$/.test(before);
      if (bulletMatch || orderedMatch) {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          let block: Element | null = range.startContainer as Element;
          if (block.nodeType === Node.TEXT_NODE) block = block.parentElement;
          while (block && block !== divRef.current) {
            if (["P", "LI", "DIV", "H1", "H2", "H3", "PRE"].includes(block.tagName)) break;
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
      <div className="relative">
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
          className="markdown-editor relative z-10 min-h-[120px] rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer [&_a]:hover:text-blue-800 [&_a]:break-words [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_pre]:rounded [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs"
        />
      </div>
      <p className="text-[10px] text-gray-500">
        ⌘B vet · ⌘I cursief · ⌘1-3 kop · ⌘⇧L bullet · ⌘⇧C code · ⌘K link · - of 1. + spatie = lijst (Ctrl op Windows)
      </p>
    </div>
  );
}
