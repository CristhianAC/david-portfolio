interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_CALLBACK_URL?: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_KEY?: string;
  readonly PUBLIC_WOMPI_PUBLIC_KEY?: string;
  readonly WOMPI_PUBLIC_KEY?: string;
  readonly WOMPI_PRIVATE_KEY?: string;
  readonly WOMPI_EVENTS?: string;
  readonly WOMPI_INTEGRITY_KEY?: string;
  readonly WOMPI_API_URL?: string;
  readonly WOMPI_SUBSCRIPTION_AMOUNT_IN_CENTS?: string;
  readonly WOMPI_SUBSCRIPTION_CURRENCY?: string;
  readonly WOMPI_SUBSCRIPTION_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
