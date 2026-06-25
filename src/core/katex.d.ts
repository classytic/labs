// `katex` is an OPTIONAL peer, imported dynamically by <Tex>. We don't depend on
// it at build time, so declare a minimal ambient module instead of installing it.
declare module 'katex' {
  const katex: {
    render: (tex: string, el: HTMLElement, opts?: { displayMode?: boolean; throwOnError?: boolean }) => void;
    renderToString: (tex: string, opts?: { displayMode?: boolean; throwOnError?: boolean }) => string;
  };
  export default katex;
}
