import React from 'react';

/**
 * Lightweight Markdown Renderer Component
 * Formats basic markdown elements cleanly without raw symbols or extra dependencies.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  // Split text into paragraphs / blocks
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let keyIdx = 0;

  lines.forEach((line) => {
    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={keyIdx++}
            className="my-3 p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto border border-slate-700/50"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={keyIdx++} className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9] mt-4 mb-2">
          {renderInline(trimmed.replace('### ', ''))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={keyIdx++} className="text-lg font-bold text-[#1B2150] dark:text-[#F1F5F9] mt-5 mb-2">
          {renderInline(trimmed.replace('## ', ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={keyIdx++} className="text-xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] mt-6 mb-3">
          {renderInline(trimmed.replace('# ', ''))}
        </h2>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={keyIdx++} className="ml-5 list-disc text-sm text-[#5F6788] dark:text-[#94A3B8] my-1">
          {renderInline(trimmed.replace(/^[-*]\s+/, ''))}
        </li>
      );
      return;
    }

    // Empty lines
    if (!trimmed) {
      elements.push(<div key={keyIdx++} className="h-2" />);
      return;
    }

    // Paragraph
    elements.push(
      <p key={keyIdx++} className="text-sm text-[#5F6788] dark:text-[#94A3B8] leading-relaxed my-1.5">
        {renderInline(trimmed)}
      </p>
    );
  });

  return <div className={`markdown-body ${className}`}>{elements}</div>;
}

/**
 * Render inline formatting (**bold**, `code`)
 */
function renderInline(textStr) {
  if (!textStr) return '';
  
  // Split by bold (**text**) and code (`text`)
  const parts = textStr.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[#1B2150] dark:text-[#F1F5F9]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-800 text-[#FF6A2B] dark:text-[#FF8048] rounded font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
