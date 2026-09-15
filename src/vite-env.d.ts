/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEAGUE_API_URL?: string;
  readonly VITE_BASE_PATH?: string;
  /** Mission Hunt backend — see MISSION_HUNT_SETUP.md. Either unset -> Mission
   * Hunt shows "SETUP REQUIRED" instead of attempting to connect. */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
