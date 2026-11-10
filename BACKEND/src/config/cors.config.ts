export function obtenerOrigenesCors(value = process.env.ALLOWED_ORIGINS): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
