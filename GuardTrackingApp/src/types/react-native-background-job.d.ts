// Type declarations for react-native-background-job
declare module 'react-native-background-job' {
  interface BackgroundJobConfig {
    jobKey: string;
    period?: number;
  }

  interface BackgroundJobStartConfig {
    jobKey: string;
  }

  interface BackgroundJob {
    register(config: BackgroundJobConfig): void;
    start(config: BackgroundJobStartConfig): void;
    stop(config: BackgroundJobStartConfig): void;
    on(jobKey: string, callback: () => void): void;
    off(jobKey: string): void;
  }

  const BackgroundJob: BackgroundJob;
  export default BackgroundJob;
}
