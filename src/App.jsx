import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  FolderOpen, Download, X, UploadCloud, Package, Trash2, Search,
  AlertCircle, FolderUp, CheckSquare, Square, ChevronDown
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
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
import FileThumbnail from './components/FileThumbnail';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const presetColors = {
  FAB: 'border-primary/40 bg-gradient-to-br from-primary/15 to-sepia/10',
  Booth: 'border-success/40 bg-gradient-to-br from-success/15 to-vintage-brown/10'
};

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
  }, [toast]);

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true
  });

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
    <div {...getRootProps()} className="flex h-screen w-screen bg-background text-cream overflow-hidden font-sans selection:bg-primary/30 paper-texture">
      <input {...getInputProps()} />

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

      {/* Drag Active Overlay */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-blue-500/10 border-4 border-dashed border-blue-500 z-30 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-[#18181b] border border-blue-500 rounded-2xl p-8">
            <UploadCloud size={64} className="text-blue-400 mb-4 mx-auto" />
            <p className="text-2xl font-semibold text-white">Drop files here</p>
          </div>
        </motion.div>
      )}

      {/* Left Pane: Input */}
      <div className="w-[420px] border-r border-primary/10 flex flex-col bg-surface">
        <div className="h-16 px-6 border-b border-primary/10 flex items-center justify-between bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="font-semibold flex items-center gap-3 text-sm tracking-wide text-primary">
            <div className="p-1.5 bg-primary/20 rounded-md text-primary border border-primary/30">
              <FolderOpen size={16} />
            </div>
            Input Sources
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-cream/60 bg-primary/10 px-2 py-1 rounded-full retro-inset">{files.length}</span>
            {files.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); clearAllFiles(); }}
                className="p-1.5 rounded-md hover:bg-danger/20 hover:text-danger text-cream/50 transition-all"
                title="Clear all files"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchFiles')}
                className="w-full bg-surface-light border border-primary/20 rounded-lg pl-9 pr-3 py-2 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all retro-inset"
              />
            </div>

            <div className="flex gap-1 text-xs">
              {['all', 'models', 'textures', 'source', 'other'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-2 py-1 rounded transition-all retro-button",
                    filterType === type
                      ? "bg-primary/30 text-cream border border-primary/50 shadow-inner"
                      : "bg-surface-light/50 text-cream/60 border border-primary/10 hover:border-primary/30"
                  )}
                >
                  {type} ({fileCounts[type]})
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-surface-light border border-primary/20 rounded-lg px-3 py-1.5 text-xs text-cream focus:outline-none focus:border-primary/60 transition-all retro-inset"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-asc">Size (Small-Large)</option>
              <option value="size-desc">Size (Large-Small)</option>
            </select>
          </div>

          {/* Drop Zone */}
          <div
            onClick={(e) => { e.stopPropagation(); document.getElementById('file-input').click(); }}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 transition-all duration-300 ease-out cursor-pointer group relative overflow-hidden vintage-border",
              isDragActive
                ? "border-primary bg-primary/15 scale-[0.99] glow-vintage"
                : "border-primary/20 hover:border-primary/40 hover:bg-surface-light/50"
            )}
          >
            <input
              id="file-input"
              type="file"
              multiple
              onChange={(e) => onDrop(Array.from(e.target.files))}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center text-center gap-2 relative z-10">
              <div className={cn(
                "p-2 rounded-full transition-colors duration-300",
                isDragActive ? "bg-primary/30 text-primary" : "bg-surface-light text-primary/60 group-hover:text-primary"
              )}>
                <UploadCloud size={20} className={isDragActive ? "text-blue-400" : ""} />
              </div>
              <div>
                <p className="text-sm font-medium text-cream group-hover:text-cream/90 transition-colors">
                  {isDragActive ? t('dropNow') : t('clickOrDrag')}
                </p>
                <p className="text-[10px] text-cream/40 mt-0.5">
                  FBX, OBJ, PNG, JPG, etc.
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Folder Upload Button */}
          <button
            onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-primary/20 rounded-lg hover:bg-primary/10 hover:border-primary/50 text-cream/70 hover:text-primary transition-all text-xs font-medium retro-button"
          >
            <FolderUp size={14} />
            Upload Folder
          </button>
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderUpload}
            className="hidden"
          />

          {/* Batch Operations */}
          {files.length > 0 && (
            <div className="flex items-center gap-2 text-xs border-t border-white/5 pt-3">
              <button
                onClick={(e) => { e.stopPropagation(); selectAll(); }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <CheckSquare size={12} />
                All
              </button>
              <span className="text-gray-700">|</span>
              <button
                onClick={(e) => { e.stopPropagation(); deselectAll(); }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Square size={12} />
                None
              </button>
              {selectedFiles.size > 0 && (
                <>
                  <span className="text-gray-700">|</span>
                  <span className="text-gray-400">{selectedFiles.size} selected</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSelected(); }}
                    className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {/* File List */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1.5 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  layout
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "group flex items-center gap-2 p-2 rounded-lg border transition-all vintage-border",
                    selectedFiles.has(file.name)
                      ? "bg-primary/15 border-primary/40 shadow-inner"
                      : "bg-surface-light/30 hover:bg-surface-light/60 border-primary/10 hover:border-primary/25"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.name)}
                    onChange={(e) => { e.stopPropagation(); toggleFileSelection(file.name); }}
                    className="flex-shrink-0 w-3 h-3 rounded border border-primary/30 bg-transparent checked:bg-primary checked:border-primary cursor-pointer"
                  />
                  <FileThumbnail file={file} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-cream/80 truncate group-hover:text-cream transition-colors">
                      {file.name}
                    </p>
                    <p className="text-[9px] text-cream/40 font-mono">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-danger/20 hover:text-danger text-cream/50 transition-all"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredFiles.length === 0 && files.length > 0 && (
              <div className="h-32 flex items-center justify-center text-cream/30 text-sm italic">
                {t('noMatchingFiles')}
              </div>
            )}

            {files.length === 0 && (
              <div className="h-32 flex items-center justify-center text-cream/30 text-sm italic">
                {t('noFilesYet')}
              </div>
            )}
          </div>
        </div>
      </div>

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
