import { z } from 'zod';

function withHttps(raw: string): string {
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().min(1),
  EXPO_PUBLIC_AI_API_URL: z.string().min(1),
  EXPO_PUBLIC_AI_API_KEY: z.string().min(1),
  EXPO_PUBLIC_GOOGLE_API_KEY: z.string().min(1),
  EXPO_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
  EXPO_PUBLIC_URS_API_URL: z.string().min(1),
  EXPO_PUBLIC_URS_API_KEY: z.string().min(1),
  EXPO_PUBLIC_APP_VARIANT: z.enum(['development', 'preview', 'production']),
});

export type AppEnv = {
  apiUrl: string;
  aiApiUrl: string;
  aiApiKey: string;
  googleApiKey: string;
  mapboxToken: string;
  ursApiUrl: string;
  ursApiKey: string;
  appVariant: AppEnvRaw['EXPO_PUBLIC_APP_VARIANT'];
};

type AppEnvRaw = z.infer<typeof envSchema>;

function readEnv(): AppEnv {
  const parsed = envSchema.safeParse({
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_AI_API_URL: process.env.EXPO_PUBLIC_AI_API_URL,
    EXPO_PUBLIC_AI_API_KEY: process.env.EXPO_PUBLIC_AI_API_KEY,
    EXPO_PUBLIC_GOOGLE_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
    EXPO_PUBLIC_MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
    EXPO_PUBLIC_URS_API_URL: process.env.EXPO_PUBLIC_URS_API_URL,
    EXPO_PUBLIC_URS_API_KEY: process.env.EXPO_PUBLIC_URS_API_KEY,
    EXPO_PUBLIC_APP_VARIANT: process.env.EXPO_PUBLIC_APP_VARIANT,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${details}`);
  }

  const raw = parsed.data;
  return {
    apiUrl: withHttps(raw.EXPO_PUBLIC_API_URL),
    aiApiUrl: withHttps(raw.EXPO_PUBLIC_AI_API_URL),
    aiApiKey: raw.EXPO_PUBLIC_AI_API_KEY,
    googleApiKey: raw.EXPO_PUBLIC_GOOGLE_API_KEY,
    mapboxToken: raw.EXPO_PUBLIC_MAPBOX_TOKEN,
    ursApiUrl: withHttps(raw.EXPO_PUBLIC_URS_API_URL),
    ursApiKey: raw.EXPO_PUBLIC_URS_API_KEY,
    appVariant: raw.EXPO_PUBLIC_APP_VARIANT,
  };
}

let cached: AppEnv | undefined;

export function getEnv(): AppEnv {
  cached ??= readEnv();
  return cached;
}

export function resetEnvCache(): void {
  cached = undefined;
}
