import { createJiti } from 'jiti';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const jiti = createJiti(import.meta.url);
const { assertApplicationEnvironment } = await jiti.import('../src/lib/env.server.ts');
assertApplicationEnvironment();
console.log('Application configuration valid');
