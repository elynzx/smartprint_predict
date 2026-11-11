export interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({
  label = "Cargando información...",
}: LoadingSpinnerProps) {
  return (
    <div className="availability-empty loading-spinner-box" role="status">
      <span className="spinner-ring" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
