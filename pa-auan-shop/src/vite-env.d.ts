/// <reference types="vite/client" />

/** Environment variables ที่ Vite อนุญาตให้ frontend อ่านได้ (ต้องขึ้นต้นด้วย VITE_) */

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
