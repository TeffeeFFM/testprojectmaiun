import React from 'react';
import Editor from 'react-simple-code-editor';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/github-dark.css';
import python from 'highlight.js/lib/languages/python';

hljs.registerLanguage('python', python);

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  placeholder = '✎ Напишите код...',
  rows = 10,
  disabled = false,
  className = '',
}) => {
  const handleChange = (code: string) => {
    onChange(code);
  };

  return (
    <div className={`code-editor-wrapper ${className}`.trim()}>
      <Editor
        value={value}
        onValueChange={handleChange}
        highlight={(code) => hljs.highlight(code, { language: 'python' }).value}
        padding={16}
        style={{
          fontFamily: '"Fira Code", "Fira Mono", "Monaco", "Courier New", monospace',
          fontSize: 14,
          lineHeight: 1.6,
          backgroundColor: 'transparent',
          color: 'inherit',
          borderRadius: '16px',
          minHeight: `${rows * 24}px`,
        }}
        textareaClassName="code-editor-textarea"
        disabled={disabled}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();

            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newValue = value.substring(0, start) + '    ' + value.substring(end);

            onChange(newValue);

            setTimeout(() => {
              target.selectionStart = target.selectionEnd = start + 4;
            }, 0);
          }
        }}
      />
    </div>
  );
};

export default CodeEditor;
