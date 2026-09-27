// loading.tsx: Next lo muestra automáticamente (con Suspense) mientras la página carga en el servidor.
export default function Loading() {
  return (
    <div className="grid flex-1 place-items-center" role="status">
      <div className="flex flex-col items-center gap-4 text-muted">
        <span className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        Preparando la mesa…
      </div>
    </div>
  );
}
