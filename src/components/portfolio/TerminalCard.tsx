import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { TerminalCard as TerminalCardType } from '../../types';

interface Props {
  data: TerminalCardType;
}

const TerminalCard: React.FC<Props> = ({ data }) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = [
    { text: '$ cat about.json', type: 'prompt' },
    { text: '{', type: 'bracket' },
    { text: `  "name": "${data.name}",`, type: 'field' },
    ...(data.alias ? [{ text: `  "alias": "${data.alias}",`, type: 'field' }] : []),
    { text: `  "role": "${data.role}",`, type: 'field' },
    ...(data.education ? [
      { text: `  "education": {`, type: 'field' },
      ...(data.education.undergraduate ? [
        { text: `    "undergraduate": "${data.education.undergraduate.degree} @ ${data.education.undergraduate.institution}",`, type: 'nested' },
      ] : []),
      ...(data.education.postgraduate ? [
        { text: `    "postgraduate": "${data.education.postgraduate.degree} @ ${data.education.postgraduate.institution}"`, type: 'nested' },
      ] : []),
      { text: `  },`, type: 'bracket' },
    ] : []),
    { text: `  "stack": {`, type: 'field' },
    ...Object.entries(typeof data.stack === 'object' ? data.stack : {}).map(([k, v]) => ({
      text: `    "${k}": [${(v as string[]).map((s: string) => `"${s}"`).join(', ')}],`,
      type: 'nested',
    })),
    { text: `  },`, type: 'bracket' },
    { text: `  "focus": [${data.focus.map(f => `"${f}"`).join(', ')}],`, type: 'field' },
    { text: `  "languages": [${data.languages.map(l => `"${l}"`).join(', ')}],`, type: 'field' },
    ...(data.specialties ? [{ text: `  "specialties": [${data.specialties.map(s => `"${s}"`).join(', ')}],`, type: 'field' }] : []),
    ...(data.scale ? [{ text: `  "scale": "${data.scale}",`, type: 'field' }] : []),
    ...(data.fun_fact ? [{ text: `  "fun_fact": "${data.fun_fact}"`, type: 'field' }] : []),
    { text: '}', type: 'bracket' },
    { text: '$ ', type: 'prompt-end' },
  ];

  useEffect(() => {
    if (currentLine >= lines.length) return;

    intervalRef.current = setTimeout(() => {
      setDisplayedLines(prev => [...prev, lines[currentLine].text]);
      setCurrentLine(prev => prev + 1);
    }, currentLine === 0 ? 500 : 80 + Math.random() * 60);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [currentLine]);

  const colorizeJson = (line: string, type: string): React.ReactNode => {
    if (type === 'prompt' || type === 'prompt-end') {
      return <span className="text-emerald-400">{line}</span>;
    }
    if (type === 'bracket') {
      return <span className="text-slate-400">{line}</span>;
    }

    const keyMatch = line.match(/^(\s*)("([^"]+)")\s*:\s*(.+)/);
    if (keyMatch) {
      const [, indent, keyWithQuotes, , valueStr] = keyMatch;
      const trailingComma = valueStr.trim().endsWith(',') ? ',' : '';
      const valuePart = valueStr.trim().replace(/,$/, '');

      let valueEl: React.ReactNode;
      if (valuePart.startsWith('[')) {
        const inner = valuePart.slice(1, -1);
        const items = inner.split(',').map((s: string) => s.trim()).filter(Boolean);
        valueEl = (
          <span>
            <span className="text-slate-400">{'['}</span>
            {items.map((item, i) => (
              <span key={i}>
                <span className="text-amber-300">{item}</span>
                {i < items.length - 1 && <span className="text-slate-400">, </span>}
              </span>
            ))}
            <span className="text-slate-400">{']'}</span>
          </span>
        );
      } else if (valuePart === '{') {
        valueEl = <span className="text-slate-400">{'{'}</span>;
      } else if (valuePart.startsWith('"')) {
        valueEl = <span className="text-amber-300">{valuePart}</span>;
      } else {
        valueEl = <span className="text-amber-300">{valuePart}</span>;
      }

      return (
        <span>
          <span className="select-none">{indent}</span>
          <span className="text-slate-200">{keyWithQuotes}</span>
          <span className="text-slate-400">: </span>
          {valueEl}
          <span className="text-slate-400">{trailingComma}</span>
        </span>
      );
    }

    return <span className="text-slate-300">{line}</span>;
  };

  return (
    <motion.div
      className="terminal-card w-full max-w-lg"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Terminal Header */}
      <div className="terminal-header px-4 py-3 flex items-center gap-3">
        <div className="flex gap-2">
          <div className="terminal-dot terminal-dot-red" />
          <div className="terminal-dot terminal-dot-yellow" />
          <div className="terminal-dot terminal-dot-green" />
        </div>
        <span
          className="flex-1 text-center font-mono text-white/30"
          style={{ fontSize: '11px' }}
        >
          {data.alias || data.name.toLowerCase().replace(/\s+/g, '')}@dev ~ — profile
        </span>
      </div>

      {/* Terminal Body */}
      <div className="terminal-body p-5 overflow-y-auto" style={{ minHeight: '260px', maxHeight: '380px' }}>
        {displayedLines.map((line, idx) => (
          <div key={idx} className="whitespace-pre">
            {colorizeJson(line, lines[idx]?.type || 'field')}
          </div>
        ))}
        <span className="terminal-cursor" />
      </div>
    </motion.div>
  );
};

export default TerminalCard;
