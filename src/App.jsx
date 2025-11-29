import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Download, Package, AlertCircle, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { exportFABMode } from './utils/fabExport';
import { exportBoothMode } from './utils/boothExport';
import { formatFileSize } from './utils/zipExport';
import { getFileExtension } from './utils/presets';
import { useToast } from './hooks/useToast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTranslation } from './utils/i18n';
import Toast from './components/Toast';
import ExportProgress from './components/ExportProgress';
import PreviewPanel from './components/PreviewPanel';
import Sidebar from './components/Sidebar';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [selectedPreset, setSelectedPreset] = useLocalStorage('selectedPreset', 'FAB');
  const [customName, setCustomName] = useLocalStorage('customName', 'Package');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useLocalStorage('sortBy', 'name-asc');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showTexturesWarning, setShowTexturesWarning] = useState(false);
  const [showPresetInfo, setShowPresetInfo] = useState(true);

  // Export progress state
  const [exportProgress, setExportProgress] = useState({
    isExporting: false,
    current: 0,
    total: 0,
    currentFile: ''
  });

  const folderInputRef = useRef(null);
  const { toasts, toast, removeToast } = useToast();

  // File deduplication
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => {
      const filesWithPath = acceptedFiles.map(file => ({
        name: file.name,
        size: file.size,
        file: file,
        path: file.path || file.webkitRelativePath || file.name
      }));

      const newFiles = filesWithPath.filter(newFile => {
        return !prev.some(existingFile =>
          existingFile.name === newFile.name && existingFile.size === newFile.size
        );
      });

      if (newFiles.length > 0) {
        toast.success(t('filesAdded', { count: newFiles.length }));
      }
      if (newFiles.length < acceptedFiles.length) {
        toast.warning(`Skipped ${acceptedFiles.length - newFiles.length} duplicate file(s)`);
      }

      return [...prev, ...newFiles];
    });
  }, [toast, t]);

  const removeFile = (name) => {
    setFiles(files.filter(f => f.name !== name));
    setSelectedFiles(new Set([...selectedFiles].filter(fn => fn !== name)));
    toast.info('File removed');
  };

  const clearAllFiles = () => {
    if (files.length > 0) {
      setFiles([]);
      setSelectedFiles(new Set());
      toast.info('All files cleared');
    }
  };

  const toggleFileSelection = (fileName) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    setSelectedFiles(new Set(filteredFiles.map(f => f.name)));
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
  };

  const deleteSelected = () => {
    if (selectedFiles.size === 0) return;

    const count = selectedFiles.size;
    setFiles(files.filter(f => !selectedFiles.has(f.name)));
    setSelectedFiles(new Set());
    toast.success(`Deleted ${count} file(s)`);
  };

  const handleFolderUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length > 0) {
      onDrop(uploadedFiles);
    }
  };

  const hasTexturesFolder = useCallback(() => {
    return files.some(file => {
      const pathParts = file.path.split('/');
      return pathParts.some(part => /^textures?$/i.test(part));
    });
  }, [files]);

  const handleExport = async () => {
    if (files.length === 0) {
      toast.warning('No files to export');
      return;
    }

    if (selectedPreset === 'FAB' && !hasTexturesFolder()) {
      setShowTexturesWarning(true);
      setTimeout(() => setShowTexturesWarning(false), 5000);
    }

    setExportProgress({ isExporting: true, current: 0, total: 1, currentFile: '' });

    try {
      if (selectedPreset === 'FAB') {
        await exportFABMode(files, customName, (progress) => {
          setExportProgress({
            isExporting: true,
            current: progress.current,
            total: progress.total,
            currentFile: progress.currentFile
          });
        });
      } else if (selectedPreset === 'Booth') {
        setExportProgress({
          isExporting: true,
          current: 1,
          total: 1,
          currentFile: `${customName}Assets.zip`
        });
        await exportBoothMode(files, customName);
      }

      toast.success('Package exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setExportProgress({ isExporting: false, current: 0, total: 0, currentFile: '' });
    }
  };

  const sanitizeCustomName = (name) => {
    return name.replace(/[<>:"/\\|?*]/g, '').trim() || 'Package';
  };

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = files;

    // Search filter
    if (searchQuery) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(f => {
        const ext = getFileExtension(f.name);
        switch (filterType) {
          case 'models':
            return ['.fbx', '.obj', '.glb', '.gltf'].includes(ext);
          case 'textures':
            return ['.png', '.jpg', '.jpeg', '.tga', '.exr', '.psd'].includes(ext);
          case 'source':
            return ['.blend', '.max', '.ma', '.mb'].includes(ext);
          case 'other':
            return !['.fbx', '.obj', '.glb', '.gltf', '.png', '.jpg', '.jpeg', '.tga', '.exr', '.psd', '.blend', '.max', '.ma', '.mb'].includes(ext);
          default:
            return true;
        }
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-asc':
          return a.size - b.size;
        case 'size-desc':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return result;
  }, [files, searchQuery, filterType, sortBy]);

  // Count files by type
  const fileCounts = useMemo(() => {
    const counts = { all: files.length, models: 0, textures: 0, source: 0, other: 0 };
    files.forEach(f => {
      const ext = getFileExtension(f.name);
      if (['.fbx', '.obj', '.glb', '.gltf'].includes(ext)) counts.models++;
      else if (['.png', '.jpg', '.jpeg', '.tga', '.exr', '.psd'].includes(ext)) counts.textures++;
      else if (['.blend', '.max', '.ma', '.mb'].includes(ext)) counts.source++;
      else counts.other++;
    });
    return counts;
  }, [files]);

  return (
    <div className="flex h-screen w-screen bg-background text-cream overflow-hidden font-sans selection:bg-primary/30 paper-texture">

      {/* Toast Notifications */}
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Export Progress */}
      <ExportProgress
        current={exportProgress.current}
        total={exportProgress.total}
        currentFile={exportProgress.currentFile}
        isVisible={exportProgress.isExporting}
      />

      {/* Textures Warning Modal */}
      <AnimatePresence>
        {showTexturesWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={() => setShowTexturesWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#18181b] border border-yellow-500/30 rounded-xl p-6 max-w-md"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <AlertCircle size={24} className="text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Textures Folder Not Found</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    FAB mode works best with a "Textures" folder. However, you can continue without it.
                  </p>
                  <button
                    onClick={() => setShowTexturesWarning(false)}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar
        files={files}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        fileCounts={fileCounts}
        onDrop={onDrop}
        folderInputRef={folderInputRef}
        handleFolderUpload={handleFolderUpload}
        selectedFiles={selectedFiles}
        selectAll={selectAll}
        deselectAll={deselectAll}
        deleteSelected={deleteSelected}
        filteredFiles={filteredFiles}
        onToggleSelection={toggleFileSelection}
        onRemoveFile={removeFile}
        onClearAll={clearAllFiles}
      />

      {/* Right Pane: Settings & Preview */}
      <div className="flex-1 flex flex-col bg-background relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none" />

        {/* Header */}
        <div className="h-20 border-b border-primary/10 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-md sticky top-0 z-10 vintage-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-1.5 rounded-md border",
                selectedPreset === 'FAB' ? "bg-primary/20 text-primary border-primary/40" : "bg-success/20 text-success border-success/40"
              )}>
                <Package size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-cream/50 uppercase tracking-wider">Preset</span>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className={cn(
                    "bg-transparent border-0 text-sm font-semibold cursor-pointer focus:outline-none",
                    selectedPreset === 'FAB' ? "text-primary" : "text-success"
                  )}
                >
                  <option value="FAB">FAB (Unreal)</option>
                  <option value="Booth">Booth</option>
                </select>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10" />

            <div className="flex flex-col">
              <span className="text-[10px] text-cream/50 uppercase tracking-wider mb-1">Package Name</span>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(sanitizeCustomName(e.target.value))}
                placeholder="Package Name"
                className="bg-surface-light border border-primary/20 rounded-lg px-3 py-1.5 text-sm font-medium text-cream focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all w-56 retro-inset"
              />
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); handleExport(); }}
            disabled={files.length === 0 || exportProgress.isExporting}
            className={cn(
              "px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all retro-button",
              files.length === 0 || exportProgress.isExporting
                ? "bg-surface-light text-cream/30 cursor-not-allowed border border-primary/10"
                : "bg-gradient-to-r from-primary to-accent text-background hover:from-primary/90 hover:to-accent/90 hover:scale-105 shadow-lg hover:shadow-primary/30 active:scale-95 border border-primary/50"
            )}
          >
            <Download size={16} />
            {exportProgress.isExporting ? 'Exporting...' : 'Export Package'}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto relative z-0 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-4">
            {files.length > 0 ? (
              <>
                {/* Preset Info (Collapsible) */}
                <div className={cn(
                  "rounded-xl border p-4 transition-all backdrop-blur-sm retro-inset",
                  selectedPreset === 'FAB' ? "bg-surface-light border-primary/30" : "bg-surface/50 border-primary/10 hover:border-primary/20"
                )}>
                  <button
                    onClick={() => setShowPresetInfo(!showPresetInfo)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Package size={14} />
                      <h3 className="font-semibold text-sm flex items-center gap-2 text-cream">
                        {selectedPreset === 'FAB' ? (
                          <span className="text-primary">{t('fabModeInfo')}</span>
                        ) : (
                          <span className="text-success">{t('boothModeInfo')}</span>
                        )}
                      </h3>
                    </div>
                    <motion.div
                      animate={{ rotate: showPresetInfo ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showPresetInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-current/10 space-y-2 text-xs">
                          {selectedPreset === 'FAB' ? (
                            <>
                              <p className="text-cream/70">
                                Creates separate ZIP files for each 3D model format (.FBX, .OBJ, .GLB).
                              </p>
                              <ul className="text-cream/60 space-y-1 list-disc list-inside">
                                <li>Duplicates Textures folder into each package</li>
                                <li>Applies Unreal Engine naming conventions</li>
                                <li>Converts normal maps to DirectX format if needed</li>
                                <li>Output: {customName}_FBX.zip, {customName}_OBJ.zip, etc.</li>
                              </ul>
                            </>
                          ) : (
                            <>
                              <p className="text-cream/70">
                                Creates a single ZIP file with categorized subfolders.
                              </p>
                              <ul className="text-cream/60 space-y-1 list-disc list-inside">
                                <li>Mesh/ - 3D models (.fbx, .obj, .glb)</li>
                                <li>Textures/ - Image files</li>
                                <li>Unity/ - Unity packages</li>
                                <li>Source/ - Source files (.blend, .max)</li>
                              </ul>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Preview Panel */}
                <div className="rounded-xl border border-primary/10 bg-surface/30 p-6 vintage-border">
                  <PreviewPanel
                    selectedPreset={selectedPreset}
                    files={files}
                    customName={customName}
                  />
                </div>

                {/* Files Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-primary/10 bg-surface/30 p-4 retro-inset">
                    <p className="text-xs text-cream/50 mb-1">Total Files</p>
                    <p className="text-2xl font-bold text-cream">{files.length}</p>
                  </div>
                  <div className="rounded-lg border border-primary/10 bg-surface/30 p-4 retro-inset">
                    <p className="text-xs text-cream/50 mb-1">Total Size</p>
                    <p className="text-2xl font-bold text-cream">
                      {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/10 bg-surface/30 p-4 retro-inset">
                    <p className="text-xs text-cream/50 mb-1">Selected</p>
                    <p className="text-2xl font-bold text-primary">{selectedFiles.size}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <motion.div
                  animate={{ rotate: 12 }}
                  className="w-20 h-20 rounded-2xl bg-surface-light flex items-center justify-center mb-6 border border-primary/20 shadow-lg"
                >
                  <Package size={40} className="text-primary/60" />
                </motion.div>
                <h3 className="text-2xl font-bold text-cream mb-2">{t('readyToPack')}</h3>
                <p className="text-cream/50 max-w-md mb-6">
                  {t('dragAndDropHint')}
                </p>
                <div className="flex gap-3 text-sm">
                  <div className="flex items-center gap-2 text-cream/60">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Smart file organization
                  </div>
                  <div className="flex items-center gap-2 text-cream/60">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    UE naming support
                  </div>
                  <div className="flex items-center gap-2 text-cream/60">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    Multi-format export
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
