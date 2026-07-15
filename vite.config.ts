import { defineConfig, type PluginOption } from 'vite';

function hasSwcNativeBindingFailure(value: unknown, seen = new Set<object>()): boolean {
  if (typeof value === 'string') {
    return (
      value.includes('Failed to load native binding') ||
      value.includes('Application Control policy has blocked this file')
    );
  }
  if (typeof value !== 'object' || value === null || seen.has(value)) return false;
  seen.add(value);
  if (value instanceof Error && hasSwcNativeBindingFailure(value.message, seen)) return true;
  if (value instanceof Error && hasSwcNativeBindingFailure(value.cause, seen)) return true;
  return Array.isArray(value) && value.some((entry) => hasSwcNativeBindingFailure(entry, seen));
}

async function loadReactPlugin(): Promise<PluginOption[]> {
  try {
    const { default: react } = await import('@vitejs/plugin-react-swc');
    return [react()];
  } catch (caught) {
    if (!hasSwcNativeBindingFailure(caught)) throw caught;
    console.warn(
      '[vite] SWC native binding is unavailable; using Vite JSX transformation without React Fast Refresh.',
    );
    return [];
  }
}

export default defineConfig(async () => ({
  base: process.env.BASE_PATH ?? '/',
  plugins: await loadReactPlugin(),
  build: {
    target: 'es2023',
  },
}));
