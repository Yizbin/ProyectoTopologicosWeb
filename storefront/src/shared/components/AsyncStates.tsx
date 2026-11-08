export function LoadingState({
  label = 'Cargando información…',
}: {
  label?: string;
}) {
  return (
    <div className="state-card" role="status">
      <span className="spinner" />
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="state-card state-error" role="alert">
      <span className="state-icon">!</span>
      <div>
        <strong>No pudimos cargar esta información</strong>
        <p>{message}</p>
      </div>
      {retry && (
        <button className="button button-secondary" onClick={retry}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-illustration" aria-hidden="true">
        ⌂
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
