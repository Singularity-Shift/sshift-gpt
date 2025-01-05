import React from 'react';
import { Button } from './button';
import { Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  value: string;
  onCopy: (text: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, onCopy }) => {
  return (
    <div className="relative">
      <div className="flex justify-between items-center bg-gray-800 text-white p-2 rounded-t">
        <span className="text-sm">{language}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onCopy(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={materialDark}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}; 