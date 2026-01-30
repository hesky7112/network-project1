export interface EnvironmentVariables {
  NEXT_PUBLIC_API_URL: string
  CUSTOM_KEY?: string
  NODE_ENV: 'development' | 'production' | 'test'
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvironmentVariables {}
  }
}
