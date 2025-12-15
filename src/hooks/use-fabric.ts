'use client';

import { useEffect, useState } from 'react';

let fabricInstance: any = null;

/**
 * Hook para importar Fabric.js de forma segura en Next.js
 * Retorna la instancia de Fabric cuando esté disponible
 */
export function useFabric() {
  const [fabric, setFabric] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Si ya está cargado, usarlo
    if (fabricInstance) {
      setFabric(fabricInstance);
      setIsLoading(false);
      return;
    }

    // Importar Fabric.js dinámicamente
    import('fabric')
      .then((module) => {
        fabricInstance = module;
        setFabric(module);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error importing fabric:', err);
        setError(err);
        setIsLoading(false);
      });
  }, []);

  return { fabric, isLoading, error };
}
