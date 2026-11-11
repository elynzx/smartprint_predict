export interface MovementsPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (nextPage: number) => void;
}

export function MovementsPagination({
  page,
  limit,
  total,
  totalPages,
  isLoading = false,
  onPageChange,
}: MovementsPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = total === 0 ? 0 : Math.min(total, page * limit);

  const pageNumbers: number[] = [];
  const maxVisibleButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisibleButtons / 2));
  const endPage = Math.min(safeTotalPages, startPage + maxVisibleButtons - 1);
  if (endPage - startPage + 1 < maxVisibleButtons) {
    startPage = Math.max(1, endPage - maxVisibleButtons + 1);
  }
  for (let p = startPage; p <= endPage; p += 1) {
    pageNumbers.push(p);
  }

  return (
    <div
      className="table-pagination-bar"
      role="navigation"
      aria-label="Paginación de movimientos"
    >
      <span className="pagination-summary text-[#75819A]">
        Mostrando{" "}
        <strong className="font-mono tabular-nums text-[#17233D]">
          {startRecord}-{endRecord}
        </strong>{" "}
        de{" "}
        <strong className="font-mono tabular-nums text-[#17233D]">
          {total}
        </strong>{" "}
        registros
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>

        {pageNumbers.map((pageNum) => {
          const isActive = pageNum === page;
          return (
            <button
              key={pageNum}
              type="button"
              className={
                isActive
                  ? "pagination-page-btn active bg-[#0F52BA] text-white"
                  : "pagination-page-btn"
              }
              aria-current={isActive ? "page" : undefined}
              disabled={isLoading}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          className="pagination-btn"
          disabled={page >= safeTotalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
