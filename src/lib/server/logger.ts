export const logger = {
  info(message: string, metadata?: unknown) {
    console.info(`[DeepfakeCheck] ${message}`, metadata ?? "");
  },
  warn(message: string, metadata?: unknown) {
    console.warn(`[DeepfakeCheck] ${message}`, metadata ?? "");
  },
  error(message: string, metadata?: unknown) {
    console.error(`[DeepfakeCheck] ${message}`, metadata ?? "");
  }
};
