import * as monaco from 'monaco-editor';

// Register the Ink language
monaco.languages.register({ id: 'ink' });

// Define syntax highlighting rules
monaco.languages.setMonarchTokensProvider('ink', {
  tokenizer: {
    root: [
      // Comments
      [/#.*$/, 'comment'],
      
      // Knots and stitches
      [/^=+\s*([^=\n]+)$/, 'keyword'],
      
      // Choice markers
      [/^\s*[*+]\s/, 'keyword'],
      
      // Variables and logic
      [/\{[^}]+\}/, 'variable'],
      
      // Divert arrows
      [/->/, 'keyword'],
      
      // Tags
      [/#[^\s#]+/, 'tag'],
      
      // Logic operators
      [/(?:and|or|not|\?|:)/, 'operator'],
      
      // Numbers
      [/\d+/, 'number'],
      
      // Strings
      [/"[^"]*"/, 'string'],
    ],
  },
});

// Define completion items
monaco.languages.registerCompletionItemProvider('ink', {
  provideCompletionItems: () => {
    const suggestions = [
      {
        label: 'knot',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '=== ${1:knotName} ===\n$0',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a new knot'
      },
      {
        label: 'choice',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '* [$1] $0',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Add a choice option'
      },
      {
        label: 'condition',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '{ $1: $2 }$0',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Add a conditional statement'
      },
      {
        label: 'divert',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '-> ${1:knotName}$0',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Divert to another knot'
      }
    ];

    return { suggestions };
  }
});

// Define the language configuration for bracket matching, auto-closing, etc.
monaco.languages.setLanguageConfiguration('ink', {
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"]
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' }
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' }
  ],
  folding: {
    markers: {
      start: new RegExp("^\\s*//\\s*#region"),
      end: new RegExp("^\\s*//\\s*#endregion")
    }
  }
});
