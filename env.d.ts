/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  readonly SESSION_SECRET: string;
  readonly JAZZCASH_MERCHANT_ID: string;
  readonly JAZZCASH_PASSWORD: string;
  readonly JAZZCASH_INTEGRITY_SALT: string;
  readonly JAZZCASH_SANDBOX_URL: string;
  readonly JAZZCASH_RETURN_URL: string;
  readonly SITE_NAME: string;
}
