'use client';

import React, { useState } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLength: number;
}

export function TruncatedText({ text, maxLength }: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return null;
  
  if (text.length <= maxLength || expanded) {
    return <span>{text}</span>;
  }
  
  return (
    <span>
      {text.substring(0, maxLength)}...{' '}
      <button
        onClick={() => setExpanded(true)}
        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
      >
        Show more
      </button>
    </span>
  );
} 