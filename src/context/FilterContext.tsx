import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppFilterConfig, createDefaultAppFilterConfig, SavedFilter, ItemCategory, ITEM_CATEGORIES } from '../types';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, setDoc, collection, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface FilterContextType {
  config: AppFilterConfig;
  updateConfig: (newConfig: AppFilterConfig) => void;
  userId: string | null;
  isAuthReady: boolean;
  savedFilters: SavedFilter[];
  activeFilterId: string | null;
  saveNewFilter: (name: string) => Promise<void>;
  updateCurrentFilter: () => Promise<void>;
  loadFilter: (id: string) => Promise<void>;
  deleteFilter: (id: string) => Promise<void>;
  resetFilter: () => void;
  copyModsToAll: (sourceCategory: ItemCategory) => void;
  copyModsToSpecific: (sourceCategory: ItemCategory, targetCategory: ItemCategory) => void;
  isSaving: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppFilterConfig>(createDefaultAppFilterConfig());
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    let isInitialLoad = true;

    // Listen to user doc for activeFilterId
    const unsubscribeUser = onSnapshot(doc(db, 'users', userId), async (docSnap) => {
      if (docSnap.exists() && isInitialLoad) {
        const data = docSnap.data();
        if (data.activeFilterId) {
          setActiveFilterId(data.activeFilterId);
          // Fetch that specific filter to load its config
          const filterDoc = await getDoc(doc(db, 'users', userId, 'filters', data.activeFilterId));
          if (filterDoc.exists()) {
            try {
              const filterData = filterDoc.data();
              setConfig(JSON.parse(filterData.config));
            } catch (e) {
              console.error("Failed to parse initial config", e);
            }
          }
        }
        isInitialLoad = false;
      }
    });

    // Listen to all saved filters
    const unsubscribeFilters = onSnapshot(collection(db, 'users', userId, 'filters'), (snapshot) => {
      const filters = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          config: JSON.parse(data.config || '{}'),
          updatedAt: data.updatedAt
        } as SavedFilter;
      });
      setSavedFilters(filters.sort((a, b) => b.updatedAt - a.updatedAt));
    });

    return () => {
      unsubscribeUser();
      unsubscribeFilters();
    };
  }, [userId]);

  const updateConfig = (newConfig: AppFilterConfig) => {
    setConfig(newConfig);
  };

  const saveNewFilter = async (name: string) => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const newDocRef = doc(collection(db, 'users', userId, 'filters'));
      await setDoc(newDocRef, {
        name,
        config: JSON.stringify(config),
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'users', userId), { activeFilterId: newDocRef.id }, { merge: true });
      setActiveFilterId(newDocRef.id);
    } catch (error) {
      console.error("Error saving new filter:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateCurrentFilter = async () => {
    if (!userId || !activeFilterId) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', userId, 'filters', activeFilterId), {
        config: JSON.stringify(config),
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating filter:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadFilter = async (id: string) => {
    if (!userId) return;
    const filter = savedFilters.find(f => f.id === id);
    if (filter) {
      setConfig(filter.config);
      setActiveFilterId(id);
      await setDoc(doc(db, 'users', userId), { activeFilterId: id }, { merge: true });
    }
  };

  const deleteFilter = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'filters', id));
      if (activeFilterId === id) {
        setActiveFilterId(null);
        await setDoc(doc(db, 'users', userId), { activeFilterId: null }, { merge: true });
      }
    } catch (error) {
      console.error("Error deleting filter:", error);
    }
  };

  const resetFilter = () => {
    setConfig(createDefaultAppFilterConfig());
    setActiveFilterId(null);
  };

  const copyModsToAll = (sourceCategory: ItemCategory) => {
    setConfig(prevConfig => {
      const sourceMods = JSON.parse(JSON.stringify(prevConfig[sourceCategory].mods));
      const newConfig = { ...prevConfig };
      
      ITEM_CATEGORIES.forEach(cat => {
        if (cat !== sourceCategory) {
          newConfig[cat] = {
            ...newConfig[cat],
            mods: JSON.parse(JSON.stringify(sourceMods))
          };
        }
      });
      
      console.log(`Copied mods from ${sourceCategory} to all other categories`);
      return newConfig;
    });
  };

  const copyModsToSpecific = (sourceCategory: ItemCategory, targetCategory: ItemCategory) => {
    setConfig(prevConfig => {
      const sourceMods = JSON.parse(JSON.stringify(prevConfig[sourceCategory].mods));
      const newConfig = { ...prevConfig };
      
      newConfig[targetCategory] = {
        ...newConfig[targetCategory],
        mods: JSON.parse(JSON.stringify(sourceMods))
      };
      
      console.log(`Copied mods from ${sourceCategory} to ${targetCategory}`);
      return newConfig;
    });
  };

  return (
    <FilterContext.Provider value={{ 
      config, updateConfig, userId, isAuthReady, isSaving,
      savedFilters, activeFilterId, saveNewFilter, updateCurrentFilter, loadFilter, deleteFilter,
      resetFilter, copyModsToAll, copyModsToSpecific
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
