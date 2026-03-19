export function initConsoleProtection(storeName = 'esta tienda'): void {
  if (typeof window === 'undefined') return;

  const styleTitle = [
    'color: #FF0000',
    'font-size: 48px',
    'font-weight: 900',
    'font-family: sans-serif',
  ].join(';');

  const styleWarning = [
    'color: #ffffff',
    'font-size: 14px',
    'line-height: 1.8',
    'font-family: sans-serif',
  ].join(';');

  const styleInfo = [
    'color: #8e0303',
    'font-size: 12px',
    'line-height: 1.8',
    'font-family: sans-serif',
  ].join(';');

  console.log('%c⚠ ¡Alto!', styleTitle);

  console.log(
    `%c${storeName} opera bajo un sistema de métricas, precios y transacciones auditadas en tiempo real.\n` +
      `Cualquier intento de modificar precios, cantidades, descuentos o datos de sesión desde esta consola ` +
      `es detectado automáticamente y puede derivar en acciones legales.\n` +
      `Si tienes alguna duda con gusto lo podemos resolver.`,
    styleWarning,
  );

  console.log('%c¿Dudas? Escríbenos a: seguridad@aura-digital.com', styleInfo);

  // Sobrescribe console en producción para silenciar logs accidentales
  if (location.hostname !== 'localhost') {
    console.log = () => void 0;
    console.warn = () => void 0;
    console.info = () => void 0;
    // console.error se deja para monitoreo real
  }
}
