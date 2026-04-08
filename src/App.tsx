import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FilterProvider, useFilter } from './context/FilterContext';
import { HomeView } from './components/HomeView';
import { ModView } from './components/ModView';
import { ItemCategory } from './types';
import { signInWithGoogle, logOut } from './services/firebase';
import { decodeBase64Filter, encodeBase64Filter } from './utils/filterCodec';

const MainApp = () => {
  const [viewMode, setViewMode] = useState<'home' | 'mods'>('home');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('Helmet');
  
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [importBase64, setImportBase64] = useState('');
  const [exportBase64, setExportBase64] = useState('');
  const [importError, setImportError] = useState('');
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);

  const { 
    userId, isAuthReady, isSaving, 
    savedFilters, activeFilterId, 
    saveNewFilter, updateCurrentFilter, loadFilter, deleteFilter,
    updateConfig, resetFilter, config
  } = useFilter();

  const activeFilter = savedFilters.find(f => f.id === activeFilterId);

  const handleExport = () => {
    const base64 = encodeBase64Filter(config);
    setExportBase64(base64);
    setIsExportOpen(true);
  };

  const handleImport = () => {
    try {
      setImportError('');
      const newConfig = decodeBase64Filter(importBase64);
      updateConfig(newConfig);
      setIsImportOpen(false);
      setImportBase64('');
    } catch (err) {
      setImportError('Invalid Base64 Filter Code. Please check your input.');
    }
  };

  const handleDownloadJson = () => {
    try {
      setImportError('');
      const jsonString = atob(importBase64);
      // Pretty print JSON
      const prettyJson = JSON.stringify(JSON.parse(jsonString), null, 2);
      
      const blob = new Blob([prettyJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hero-siege-filter-debug.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloadFeedback(true);
      setTimeout(() => setDownloadFeedback(false), 2000);
    } catch (err) {
      setImportError('Invalid Base64 string. Cannot convert to JSON.');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Hero Siege Filter</h1>
          <p className="text-gray-400">Sign in to create and save your custom loot filter configurations.</p>
          <motion.button
            onClick={signInWithGoogle}
            className="w-full py-3 px-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col relative w-full">
        <div className="absolute top-0 right-0 p-4 flex items-center space-x-3 z-10">
          {activeFilterId && (
            <motion.button
              onClick={updateCurrentFilter}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
              whileTap={{ scale: 0.95 }}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save ({activeFilter?.name})</span>
                </>
              )}
            </motion.button>
          )}

          <motion.button
            onClick={resetFilter}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all flex items-center space-x-2 border border-gray-700"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Filter</span>
          </motion.button>

          <motion.button
            onClick={() => setIsSaveAsOpen(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all flex items-center space-x-2 border border-gray-700"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Save As...</span>
          </motion.button>

          <motion.button
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all flex items-center space-x-2 border border-gray-700"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Import</span>
          </motion.button>

          <motion.button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all flex items-center space-x-2 border border-gray-700"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Export</span>
          </motion.button>

          <motion.button
            onClick={() => setIsLoadOpen(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all flex items-center space-x-2 border border-gray-700"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Load Filter</span>
          </motion.button>

          <motion.button
            onClick={logOut}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/60 text-red-200 text-sm font-medium rounded-lg transition-all border border-red-900/50"
            whileTap={{ scale: 0.95 }}
          >
            Sign Out
          </motion.button>
        </div>
        
        {viewMode === 'home' ? (
          <HomeView onCategoryClick={(cat) => { setSelectedCategory(cat); setViewMode('mods'); }} />
        ) : (
          <ModView category={selectedCategory} onBack={() => setViewMode('home')} />
        )}
      </div>

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 w-[500px] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Import Filter</h3>
              <motion.button onClick={() => setIsImportOpen(false)} className="text-gray-400 hover:text-white" whileTap={{ scale: 0.9 }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>
            <p className="text-sm text-gray-400">Paste your Base64 encoded filter string below to import it.</p>
            <textarea 
              value={importBase64}
              onChange={e => setImportBase64(e.target.value)}
              placeholder="eyJ2ZXJzaW9uIjoyLCJ0MCI6..."
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 h-32 resize-none font-mono text-xs"
              autoFocus
            />
            {importError && <p className="text-red-400 text-sm">{importError}</p>}
            <div className="flex justify-end space-x-3 pt-2">
              <motion.button 
                onClick={() => setIsImportOpen(false)} 
                className="px-4 py-2 text-gray-400 hover:text-red-400 transition-all font-medium"
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button 
                onClick={handleDownloadJson}
                disabled={!importBase64.trim()}
                className={`px-4 py-2 rounded-lg disabled:opacity-50 text-sm font-medium transition-all border flex items-center space-x-2 ${
                  downloadFeedback 
                    ? 'bg-green-600/20 text-green-400 border-green-500/50' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {downloadFeedback ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <span>Download JSON</span>
                )}
              </motion.button>
              <motion.button 
                onClick={handleImport}
                disabled={!importBase64.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
                whileTap={{ scale: 0.95 }}
              >
                Import
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 w-[500px] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Export Filter</h3>
              <motion.button onClick={() => setIsExportOpen(false)} className="text-gray-400 hover:text-white" whileTap={{ scale: 0.9 }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>
            <p className="text-sm text-gray-400">Copy the Base64 encoded filter string below to share or save it.</p>
            <textarea 
              readOnly
              value={exportBase64}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 h-32 resize-none font-mono text-xs"
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="flex justify-end space-x-3 pt-2">
              <motion.button 
                onClick={() => setIsExportOpen(false)} 
                className="px-4 py-2 text-gray-400 hover:text-red-400 transition-all font-medium"
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
              <motion.button 
                onClick={() => {
                  navigator.clipboard.writeText(exportBase64);
                  setCopyFeedback(true);
                  setTimeout(() => setCopyFeedback(false), 2000);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center space-x-2 ${
                  copyFeedback 
                    ? 'bg-green-600/20 text-green-400 border-green-500/50' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {copyFeedback ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <span>Copy to Clipboard</span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Save As Modal */}
      {isSaveAsOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 w-96 space-y-4">
            <h3 className="text-xl font-bold text-white">Save Filter As</h3>
            <input 
              type="text" 
              value={newFilterName}
              onChange={e => setNewFilterName(e.target.value)}
              placeholder="Filter Name (e.g. Poison Necro)"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex justify-end space-x-3 pt-2">
              <motion.button 
                onClick={() => setIsSaveAsOpen(false)} 
                className="px-4 py-2 text-gray-400 hover:text-red-400 transition-all font-medium"
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button 
                onClick={() => {
                  if (newFilterName.trim()) {
                    saveNewFilter(newFilterName.trim());
                    setIsSaveAsOpen(false);
                    setNewFilterName('');
                  }
                }}
                disabled={!newFilterName.trim() || isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-all font-medium shadow-lg shadow-indigo-500/20"
                whileTap={{ scale: 0.95 }}
              >
                Save
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {isLoadOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 w-[500px] max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Load Filter</h3>
              <motion.button onClick={() => setIsLoadOpen(false)} className="text-gray-400 hover:text-white" whileTap={{ scale: 0.9 }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {savedFilters.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No saved filters found.</p>
              ) : (
                savedFilters.map(filter => (
                  <div key={filter.id} className={`flex items-center justify-between p-3 rounded-lg border ${activeFilterId === filter.id ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-gray-950 border-gray-800 hover:border-gray-700'}`}>
                    <div>
                      <div className="font-medium text-white flex items-center space-x-2">
                        <span>{filter.name}</span>
                        {activeFilterId === filter.id && <span className="text-[10px] uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Active</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Updated: {new Date(filter.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button 
                        onClick={() => { loadFilter(filter.id); setIsLoadOpen(false); }}
                        disabled={activeFilterId === filter.id}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 text-white text-sm rounded-lg transition-all font-medium"
                        whileTap={{ scale: 0.95 }}
                      >
                        Load
                      </motion.button>
                      <motion.button 
                        onClick={() => setFilterToDelete(filter.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </motion.button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {filterToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 w-96 space-y-4">
            <h3 className="text-xl font-bold text-white">Delete Filter</h3>
            <p className="text-gray-400">Are you sure you want to delete this filter? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 pt-2">
              <motion.button 
                onClick={() => setFilterToDelete(null)} 
                className="px-4 py-2 text-gray-400 hover:text-white transition-all font-medium"
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button 
                onClick={() => {
                  deleteFilter(filterToDelete);
                  setFilterToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium shadow-lg shadow-red-500/20"
                whileTap={{ scale: 0.95 }}
              >
                Delete
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <FilterProvider>
      <MainApp />
    </FilterProvider>
  );
}
