import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  highlightLine?: number;
}

const MONACO_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '5a6378', fontStyle: 'italic' },
    { token: 'keyword', foreground: '8b5cf6' },
    { token: 'string', foreground: '10b981' },
    { token: 'number', foreground: 'f59e0b' },
    { token: 'type', foreground: '06b6d4' },
    { token: 'function', foreground: 'e879f9' },
  ],
  colors: {
    'editor.background': '#0f1117',
    'editor.foreground': '#e8eaf0',
    'editor.lineHighlightBackground': '#1c2028',
    'editorLineNumber.foreground': '#3d4455',
    'editorLineNumber.activeForeground': '#8b91a6',
    'editor.selectionBackground': '#3730a370',
    'editorCursor.foreground': '#8b5cf6',
    'editor.inactiveSelectionBackground': '#2a2f3a50',
  },
};

export function CodeEditor({
  value,
  onChange,
  language = 'python',
  readOnly = false,
  height = '400px',
  highlightLine,
}: CodeEditorProps) {
  function handleMount(editor: any, monaco: any) {
    monaco.editor.defineTheme('code-dna', MONACO_THEME);
    monaco.editor.setTheme('code-dna');

    if (highlightLine) {
      editor.deltaDecorations([], [
        {
          range: new monaco.Range(highlightLine, 1, highlightLine, 1),
          options: {
            isWholeLine: true,
            className: 'line-highlight',
            linesDecorationsClassName: 'line-decoration-violet',
          },
        },
      ]);
    }
  }

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={(v) => onChange?.(v ?? '')}
      theme="code-dna"
      onMount={handleMount}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        renderLineHighlight: 'line',
        padding: { top: 12, bottom: 12 },
        scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 6 },
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        renderWhitespace: 'none',
        smoothScrolling: true,
      }}
    />
  );
}
