declare module 'react-syntax-highlighter' {
    import { ComponentType } from 'react';
    export const Prism: ComponentType<any>;
    export const Light: ComponentType<any>;
    export const SyntaxHighlighter: ComponentType<any>;
    export const registerLanguage: (name: string, language: any) => void;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
    export const materialDark: any;
}