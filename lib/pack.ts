import { DEFAULT, validateSettings, type Settings } from './geometry.js';
export type PackSettings = { photo: Settings; signature: Settings };
export const DEFAULT_PACK: PackSettings = {
  photo: { ...DEFAULT, fit: 'contain' },
  signature: { ...DEFAULT, width: 600, height: 200, maxKB: 50, fit: 'contain' },
};
export function validatePack(value: unknown): PackSettings {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid application settings.');
  const item = value as Record<string, unknown>;
  return {
    photo: validateSettings(item.photo),
    signature: validateSettings(item.signature),
  };
}
export function safeJobName(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .slice(0, 60) || 'application'
  );
}
