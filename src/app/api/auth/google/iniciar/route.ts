import { controladorGoogleIniciar } from '@/auth/controllers/google.oauth.controller';

export function GET() {
  return controladorGoogleIniciar();
}
