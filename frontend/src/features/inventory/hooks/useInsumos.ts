import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  exportInventoryCsv,
  fetchSupplies,
  formatSupplyCode,
} from "../services/inventoryService";
import type { SupplyItem } from "../types";

export interface UseInsumosResult {
  supplies: SupplyItem[];
  filteredSupplies: SupplyItem[];
  selectedSupply: SupplyItem | null;
  categories: string[];
  searchQuery: string;
  categoryFilter: string;
  isLoading: boolean;
  error: string;
  toastMessage: string;
  setSelectedSupply: (supply: SupplyItem | null) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  reloadSupplies: (preferredId?: number) => Promise<void>;
  handleExportCsv: () => Promise<void>;
  notifyToast: (message: string) => void;
}

export function useInsumos(): UseInsumosResult {
  const { token } = useAuth();
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [selectedSupply, setSelectedSupply] = useState<SupplyItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");

  const notifyToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? "" : current));
    }, 3600);
  }, []);

  const reloadSupplies = useCallback(
    async (preferredId?: number) => {
      if (!token) {
        setSupplies([]);
        setSelectedSupply(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const list = await fetchSupplies(token);
        setSupplies(list);
        if (list.length === 0) {
          setSelectedSupply(null);
        } else {
          setSelectedSupply((previous) => {
            const targetId = preferredId ?? previous?.id;
            if (targetId !== undefined) {
              const found = list.find((item) => item.id === targetId);
              if (found) return found;
            }
            return list[0];
          });
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el catálogo de inventario.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void reloadSupplies();
  }, [reloadSupplies]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(supplies.map((item) => item.categoria)));
    return ["Todas", ...unique];
  }, [supplies]);

  const filteredSupplies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return supplies.filter((item) => {
      const matchesCategory =
        categoryFilter === "Todas" || item.categoria === categoryFilter;
      const matchesSearch =
        !query ||
        item.nombre.toLowerCase().includes(query) ||
        item.categoria.toLowerCase().includes(query) ||
        formatSupplyCode(item.id).toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [supplies, searchQuery, categoryFilter]);

  const handleExportCsv = useCallback(async () => {
    if (!token) return;
    await exportInventoryCsv(token, supplies);
    notifyToast("Reporte CSV de inventario descargado correctamente.");
  }, [token, supplies, notifyToast]);

  return {
    supplies,
    filteredSupplies,
    selectedSupply,
    categories,
    searchQuery,
    categoryFilter,
    isLoading,
    error,
    toastMessage,
    setSelectedSupply,
    setSearchQuery,
    setCategoryFilter,
    reloadSupplies,
    handleExportCsv,
    notifyToast,
  };
}
