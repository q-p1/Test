/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" in the self-contained single-file build (hash routing). */
  readonly VITE_ARTIFACT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
