import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook genérico para llamadas a la API.
 *
 * @param {Function} apiFn         — Función que devuelve una Promise de axios
 * @param {Array}    deps          — Dependencias que provocan re-fetch automático
 * @param {{ initialData?: any }}  opts — Opciones adicionales
 *   - initialData: valor inicial para `data` antes de que llegue la respuesta
 *
 * @returns {{ data, loading, error, refetch }}
 *   - refetch(): fuerza una nueva llamada a la API sin cambiar las deps
 */
export function useApi(apiFn, deps = [], { initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contador que useEffect usa para disparar re-fetches manuales
  const [refetchIndex, setRefetchIndex] = useState(0);

  // Mantener referencia estable de apiFn para no forzar re-renders innecesarios
  const apiFnRef = useRef(apiFn);
  apiFnRef.current = apiFn;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFnRef.current()
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.detail ?? "Error al cargar datos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchIndex]);

  /** Fuerza una nueva llamada a la API sin cambiar las dependencias. */
  const refetch = useCallback(() => {
    setRefetchIndex((i) => i + 1);
  }, []);

  return { data, loading, error, refetch };
}
