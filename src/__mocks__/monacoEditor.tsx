import React from 'react';

const MonacoEditor: React.FC<any> = () => <div data-testid="monaco-editor" />;
export default MonacoEditor;
export const useMonaco = () => null;

export const loader = { config: jest.fn() };
