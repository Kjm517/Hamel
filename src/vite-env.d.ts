

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TAG_ICON_FALLBACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
