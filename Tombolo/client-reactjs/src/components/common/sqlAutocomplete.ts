import type { Monaco } from '@monaco-editor/react';
import type { editor, languages, Position, IDisposable } from 'monaco-editor';

const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'ORDER BY',
  'GROUP BY',
  'LIMIT',
  'ASC',
  'DESC',
  'COUNT',
  'AVG',
  'SUM',
  'MIN',
  'MAX',
];

interface CompletionProviderRef {
  current: IDisposable | null;
}

interface RegisterSqlAutocompleteParams {
  monaco: Monaco;
  completionProviderRef: CompletionProviderRef;
  getTables: () => string[];
  getColumns: () => string[];
  /** Characters that trigger the completion widget. Defaults to ['.', ' ']. */
  triggerCharacters?: string[];
}

export const registerSqlAutocomplete = ({
  monaco,
  completionProviderRef,
  getTables,
  getColumns,
  triggerCharacters = ['.', ' '],
}: RegisterSqlAutocompleteParams) => {
  if (completionProviderRef.current) return;

  completionProviderRef.current = monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters,
    provideCompletionItems: (model: editor.ITextModel, position: Position): languages.CompletionList => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const tableSuggestions = getTables().map(table => ({
        label: table,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: table,
        range,
      }));

      const columnSuggestions = getColumns().map(column => ({
        label: column,
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: column,
        range,
      }));

      const keywordSuggestions = SQL_KEYWORDS.map(keyword => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range,
      }));

      return { suggestions: [...keywordSuggestions, ...tableSuggestions, ...columnSuggestions] };
    },
  });
};

export const disposeSqlAutocomplete = (completionProviderRef: CompletionProviderRef) => {
  completionProviderRef.current?.dispose();
  completionProviderRef.current = null;
};
