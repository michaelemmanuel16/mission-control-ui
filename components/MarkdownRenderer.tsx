'use client';

import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ComponentPropsWithoutRef } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  enableLineClamp?: boolean;
}

export default function MarkdownRenderer({
  content,
  className = '',
  enableLineClamp = false
}: MarkdownRendererProps) {
  return (
    <div className={`${enableLineClamp ? 'line-clamp-2' : ''} ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Paragraphs
          p: ({ children }: ComponentPropsWithoutRef<'p'>) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          // Bold text
          strong: ({ children }: ComponentPropsWithoutRef<'strong'>) => (
            <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>
          ),
          // Italic text
          em: ({ children }: ComponentPropsWithoutRef<'em'>) => (
            <em className="italic">{children}</em>
          ),
          // Unordered lists
          ul: ({ children }: ComponentPropsWithoutRef<'ul'>) => (
            <ul className="list-disc list-inside mb-2 space-y-1 last:mb-0">{children}</ul>
          ),
          // Ordered lists
          ol: ({ children }: ComponentPropsWithoutRef<'ol'>) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 last:mb-0">{children}</ol>
          ),
          // List items
          li: ({ children }: ComponentPropsWithoutRef<'li'>) => (
            <li className="ml-2">{children}</li>
          ),
          // Inline code
          code: ({ children }: ComponentPropsWithoutRef<'code'>) => (
            <code className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          // Code blocks
          pre: ({ children }: ComponentPropsWithoutRef<'pre'>) => (
            <pre className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 p-3 rounded mb-2 overflow-x-auto font-mono text-sm last:mb-0">
              {children}
            </pre>
          ),
          // Blockquotes
          blockquote: ({ children }: ComponentPropsWithoutRef<'blockquote'>) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-slate-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-2 last:mb-0">
              {children}
            </blockquote>
          ),
          // Headings
          h1: ({ children }: ComponentPropsWithoutRef<'h1'>) => (
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 mt-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }: ComponentPropsWithoutRef<'h2'>) => (
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }: ComponentPropsWithoutRef<'h3'>) => (
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 mt-2 first:mt-0">{children}</h3>
          ),
          // Links
          a: ({ children, href }: ComponentPropsWithoutRef<'a'>) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Horizontal rules
          hr: () => (
            <hr className="border-gray-300 dark:border-slate-600 my-3" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
