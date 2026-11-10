export function obtenerObserveConfig() {
  const { OBSERVE_APP_KEY, OBSERVE_APP_SECRET, OBSERVE_SERVICE_ID } = process.env;
  if (!OBSERVE_APP_KEY || !OBSERVE_APP_SECRET) {
    throw new Error(
      'OBSERVE_APP_KEY y OBSERVE_APP_SECRET son obligatorios. Revisa tu archivo .env.',
    );
  }
  return {
    appKey: OBSERVE_APP_KEY,
    appSecret: OBSERVE_APP_SECRET,
    serviceId: OBSERVE_SERVICE_ID ?? 'sistema-reservas',
  };
}