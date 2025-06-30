import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

// Custom hook for managing villages data
export const useVillages = () => {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all villages
  const fetchVillages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.villagesApi.getAll();
      // API returns { villages: [...], pagination: {...}, user_role: string, access_scope: string }
      setVillages(Array.isArray(response.villages) ? response.villages : []);
    } catch (err) {
      setError(err.message);
      setVillages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new village
  const createVillage = useCallback(async (villageData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.villagesApi.create(villageData);
      // API returns { success: true, data: {...}, message: string }
      const newVillage = response.data;
      setVillages(prev => [...prev, newVillage]);
      return newVillage;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update village
  const updateVillage = useCallback(async (id, villageData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.villagesApi.update(id, villageData);
      // API returns { success: true, data: {...}, message: string }
      const updatedVillage = response.data;
      setVillages(prev => 
        prev.map(village => 
          village.id === id ? updatedVillage : village
        )
      );
      return updatedVillage;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete village
  const deleteVillage = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.villagesApi.delete(id);
      setVillages(prev => prev.filter(village => village.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load villages on mount
  useEffect(() => {
    fetchVillages();
  }, [fetchVillages]);

  return {
    villages,
    loading,
    error,
    fetchVillages,
    createVillage,
    updateVillage,
    deleteVillage,
  };
};

