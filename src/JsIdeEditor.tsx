import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { tags as t } from '@lezer/highlight';
import { cn } from '@/lib/cn';

export interface JsIdeOptions {
  lineNumbers: boolean;
  syntaxHighlight: boolean;
  bracketMatch: boolean;
  activeLine: boolean;
  codeFold: boolean;
  autocomplete: boolean;
  wordWrap: boolean;
}

export const DEFAULT_JS_IDE_OPTIONS: JsIdeOptions = {
  lineNumbers: true,
  syntaxHighlight: true,
  bracketMatch: true,
  activeLine: true,
  codeFold: true,
  autocomplete: true,
  wordWrap: false,
};

const OPTION_LABELS: { key: keyof JsIdeOptions; label: string }[] = [
  { key: 'lineNumbers', label: 'Line numbers' },
  { key: 'syntaxHighlight', label: 'Syntax highlight' },
  { key: 'bracketMatch', label: 'Bracket match' },
  { key: 'activeLine', label: 'Active line' },
  { key: 'codeFold', label: 'Code fold' },
  { key: 'autocomplete', label: 'Autocomplete' },
  { key: 'wordWrap', label: 'Word wrap' },
];

/** Strong colors so highlighting is obvious when enabled. */
const jsHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#cf222e', fontWeight: '700' },
  { tag: t.controlKeyword, color: '#cf222e', fontWeight: '700' },
  { tag: t.operatorKeyword, color: '#cf222e', fontWeight: '700' },
  { tag: t.definitionKeyword, color: '#cf222e', fontWeight: '700' },
  { tag: t.moduleKeyword, color: '#cf222e', fontWeight: '700' },
  { tag: t.string, color: '#0a3069' },
  { tag: t.number, color: '#0550ae' },
  { tag: t.bool, color: '#0550ae' },
  { tag: t.null, color: '#0550ae' },
  { tag: t.comment, color: '#6e7781', fontStyle: 'italic' },
  { tag: t.function(t.variableName), color: '#8250df' },
  { tag: t.function(t.propertyName), color: '#8250df' },
  { tag: t.variableName, color: '#953800' },
  { tag: t.propertyName, color: '#0550ae' },
  { tag: t.operator, color: '#cf222e' },
  { tag: t.punctuation, color: '#24292f' },
  { tag: t.bracket, color: '#24292f', fontWeight: '700' },
  { tag: t.paren, color: '#24292f' },
  { tag: t.squareBracket, color: '#24292f' },
  { tag: t.brace, color: '#24292f' },
]);

const baseTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    lineHeight: '1.6',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: '#0f766e',
    minHeight: '100%',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  '.cm-gutters': {
    backgroundColor: '#f6f8fa',
    color: '#656d76',
    borderRight: '1px solid #d0d7de',
    minHeight: '100%',
  },
  '.cm-gutter': {
    minWidth: '2.25rem',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 12px',
    minWidth: '2rem',
  },
  '.cm-foldGutter .cm-gutterElement': {
    padding: '0 4px',
    cursor: 'pointer',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#ddf4ff',
    color: '#0550ae',
    fontWeight: '600',
  },
  '.cm-activeLine': {
    backgroundColor: '#ddf4ff66',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#a7f3d0',
    outline: '1px solid #059669',
    borderRadius: '2px',
  },
  '.cm-nonmatchingBracket': {
    backgroundColor: '#fecaca',
    outline: '1px solid #dc2626',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: '#b6e3ff !important',
  },
  '.cm-tooltip': {
    border: '1px solid #d0d7de',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: '#0969da',
    color: '#ffffff',
  },
});

function buildExtensions(options: JsIdeOptions): Extension[] {
  const extensions: Extension[] = [
    history(),
    indentOnInput(),
    EditorState.tabSize.of(2),
    keymap.of([
      indentWithTab,
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    baseTheme,
    highlightSelectionMatches(),
    EditorView.editable.of(true),
  ];

  // Always load JS language so fold / autocomplete understand the code
  extensions.push(javascript({ jsx: false, typescript: false }));

  if (options.syntaxHighlight) {
    extensions.push(syntaxHighlighting(jsHighlightStyle));
  }

  if (options.lineNumbers) {
    extensions.push(lineNumbers());
  }

  if (options.bracketMatch) {
    extensions.push(bracketMatching());
    extensions.push(closeBrackets());
  }

  if (options.activeLine) {
    extensions.push(highlightActiveLine());
    extensions.push(highlightActiveLineGutter());
  }

  if (options.codeFold) {
    extensions.push(foldGutter());
  }

  if (options.autocomplete) {
    extensions.push(
      autocompletion({
        activateOnTyping: true,
        maxRenderedOptions: 20,
      }),
    );
  }

  if (options.wordWrap) {
    extensions.push(EditorView.lineWrapping);
  }

  return extensions;
}

export function JsIdeEditor({
  value,
  onChange,
  options,
  onOptionsChange,
}: {
  value: string;
  onChange: (value: string) => void;
  options: JsIdeOptions;
  onOptionsChange: (next: JsIdeOptions) => void;
}) {
  const extensions = useMemo(() => buildExtensions(options), [options]);
  // Force remount so every toggle reliably applies (CodeMirror compartments can lag)
  const editorKey = useMemo(
    () =>
      Object.entries(options)
        .map(([k, v]) => `${k}:${v ? 1 : 0}`)
        .join('|'),
    [options],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-hairline bg-[#f6f8fa] px-3 py-2.5">
        <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-[#656d76]">IDE</span>
        {OPTION_LABELS.map(({ key, label }) => {
          const on = options[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => onOptionsChange({ ...options, [key]: !on })}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                on
                  ? 'border-[#0969da] bg-[#ddf4ff] text-[#0550ae]'
                  : 'border-[#d0d7de] bg-white text-[#656d76] hover:bg-[#f6f8fa]',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        className="min-h-[20rem] min-w-[24rem] w-full resize overflow-hidden rounded-md border border-[#d0d7de] bg-white shadow-sm"
        style={{ height: '24rem' }}
      >
        <CodeMirror
          key={editorKey}
          value={value}
          height="100%"
          width="100%"
          theme="none"
          basicSetup={false}
          extensions={extensions}
          onChange={onChange}
          className="h-full [&_.cm-editor]:h-full [&_.cm-editor.cm-focused]:outline-none"
        />
      </div>

      <p className="text-[11px] text-content-tertiary">
        Toggle features above · resize via bottom-right handle · Ctrl/Cmd+F search · Ctrl/Cmd+Space autocomplete ·
        click fold arrows in the gutter
      </p>
    </div>
  );
}
