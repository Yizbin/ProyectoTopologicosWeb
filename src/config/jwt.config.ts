export function obtenerJwtSecret(): string {
  if (!process.env.JWT_SECRET) {
    try {
      process.loadEnvFile?.('.env');
    } catch {
      // sin .env: porque se valida abajo
    }
  }
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET no está definido o es muy corto (mínimo 32 caracteres). Revisa tu archivo .env.',
    );
  }
  return secret;
}