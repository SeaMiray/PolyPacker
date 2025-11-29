import React from 'react';

export const translations = {
    ja: {
        // Header
        inputSources: '入力元',
        targetPlatform: 'ターゲットプラットフォーム',
        packageName: 'パッケージ名',
        exportPackage: 'パッケージをエクスポート',
        exporting: 'エクスポート中...',

        // Presets
        fabPreset: 'FAB (Unreal Marketplace用)',
        boothPreset: 'Booth',

        // Search & Filter
        searchFiles: 'ファイルを検索...',
        all: 'すべて',
        models: 'モデル',
        textures: 'テクスチャ',
        source: 'ソース',
        other: 'その他',

        // Sort
        nameAsc: '名前 (A-Z)',
        nameDesc: '名前 (Z-A)',
        sizeAsc: 'サイズ (小→大)',
        sizeDesc: 'サイズ (大→小)',

        // File upload
        clickOrDrag: 'クリックまたはドラッグ',
        dropNow: '今ドロップ',
        supportedFormats: 'FBX、OBJ、PNG、JPGなど',
        uploadFolder: 'フォルダをアップロード',
        dropFilesHere: 'ファイルをここにドロップ',

        // Batch operations
        selectAll: 'すべて選択',
        selectNone: '選択解除',
        selected: '選択中',
        deleteSelected: '削除',

        // Status
        filesCount: '{count} ファイル',
        noFilesYet: 'まだファイルがありません',
        noMatchingFiles: 'フィルターに一致するファイルがありません',

        // Preview
        fabModeInfo: 'FABモード情報',
        boothModeInfo: 'Boothモード情報',
        fabDescription: '3Dモデル形式ごとに個別のZIPファイルを作成します（.FBX、.OBJ、.GLB）。',
        boothDescription: 'カテゴリ別のサブフォルダーを持つ単一のZIPファイルを作成します。',
        fabFeatures: [
            'Texturesフォルダを各パッケージに複製',
            'Unreal Engine命名規則を適用',
            '必要に応じてノーマルマップをDirectX形式に変換',
            '出力: {name}_FBX.zip、{name}_OBJ.zipなど'
        ],
        boothFeatures: [
            'Mesh/ - 3Dモデル (.fbx, .obj, .glb)',
            'Textures/ - 画像ファイル',
            'Unity/ - Unityパッケージ',
            'Source/ - ソースファイル (.blend, .max)'
        ],
        packageStructurePreview: 'パッケージ構造プレビュー',
        fabPackageStructure: 'FABパッケージ構造',
        boothPackageStructure: 'Boothパッケージ構造',
        packages: '{count} パッケージ',
        package: 'パッケージ',

        // Summary
        totalFiles: '総ファイル数',
        totalSize: '合計サイズ',
        selectedFiles: '選択中',

        // Empty state
        readyToPack: 'パッケージの準備完了',
        readyToPackDescription: '左側パネルからファイルをドラッグ＆ドロップするか、アップロードエリアをクリックして{mode}モードでパッケージングを開始します。',
        features: {
            smartOrganization: 'スマートファイル整理',
            ueNaming: 'UE命名規則対応',
            multiFormat: 'マルチフォーマット出力'
        },

        // Warnings & Notifications
        texturesFolderNotFound: 'Texturesフォルダが見つかりません',
        texturesWarningMessage: 'FABモードは「Textures」フォルダがあると最適に動作します。ただし、フォルダなしでも続行できます。',
        gotIt: '了解',

        // Toast messages
        filesAdded: '{count}個のファイルを追加しました',
        duplicatesSkipped: '{count}個の重複ファイルをスキップしました',
        fileRemoved: 'ファイルを削除しました',
        allFilesCleared: 'すべてのファイルをクリアしました',
        filesDeleted: '{count}個のファイルを削除しました',
        exportSuccess: 'パッケージのエクスポートに成功しました！',
        exportFailed: 'エクスポートに失敗しました: {error}',
        noFilesToExport: 'エクスポートするファイルがありません',

        // Export progress
        exportingPackage: 'パッケージをエクスポート中',
        progress: '進捗',
        pleaseWait: 'パッケージの準備中です。お待ちください...',
        of: '/',
        file: 'ファイル',
        files: 'ファイル'
    },

    en: {
        // Header
        inputSources: 'Input Sources',
        targetPlatform: 'Target Platform',
        packageName: 'Package Name',
        exportPackage: 'Export Package',
        exporting: 'Exporting...',

        // Presets
        fabPreset: 'FAB (Unreal Marketplace)',
        boothPreset: 'Booth',

        // Search & Filter
        searchFiles: 'Search files...',
        all: 'all',
        models: 'models',
        textures: 'textures',
        source: 'source',
        other: 'other',

        // Sort
        nameAsc: 'Name (A-Z)',
        nameDesc: 'Name (Z-A)',
        sizeAsc: 'Size (Small-Large)',
        sizeDesc: 'Size (Large-Small)',

        // File upload
        clickOrDrag: 'Click or drag',
        dropNow: 'Drop now',
        supportedFormats: 'FBX, OBJ, PNG, JPG, etc.',
        uploadFolder: 'Upload Folder',
        dropFilesHere: 'Drop files here',

        // Batch operations
        selectAll: 'All',
        selectNone: 'None',
        selected: 'selected',
        deleteSelected: 'Delete',

        // Status
        filesCount: '{count} files',
        noFilesYet: 'No files added yet',
        noMatchingFiles: 'No files match your filters',

        // Preview
        fabModeInfo: 'FAB Mode Info',
        boothModeInfo: 'Booth Mode Info',
        fabDescription: 'Creates separate ZIP files for each 3D model format (.FBX, .OBJ, .GLB).',
        boothDescription: 'Creates a single ZIP file with categorized subfolders.',
        fabFeatures: [
            'Duplicates Textures folder into each package',
            'Applies Unreal Engine naming conventions',
            'Converts normal maps to DirectX format if needed',
            'Output: {name}_FBX.zip, {name}_OBJ.zip, etc.'
        ],
        boothFeatures: [
            'Mesh/ - 3D models (.fbx, .obj, .glb)',
            'Textures/ - Image files',
            'Unity/ - Unity packages',
            'Source/ - Source files (.blend, .max)'
        ],
        packageStructurePreview: 'Package Structure Preview',
        fabPackageStructure: 'FAB Package Structure',
        boothPackageStructure: 'Booth Package Structure',
        packages: '{count} packages',
        package: 'package',

        // Summary
        totalFiles: 'Total Files',
        totalSize: 'Total Size',
        selectedFiles: 'Selected',

        // Empty state
        readyToPack: 'Ready to Pack',
        readyToPackDescription: 'Drag and drop your files, or click the upload area to get started with {mode} mode packaging.',
        features: {
            smartOrganization: 'Smart file organization',
            ueNaming: 'UE naming support',
            multiFormat: 'Multi-format export'
        },

        // Warnings & Notifications
        texturesFolderNotFound: 'Textures Folder Not Found',
        texturesWarningMessage: 'FAB mode works best with a "Textures" folder. However, you can continue without it.',
        gotIt: 'Got it',

        // Toast messages
        filesAdded: 'Added {count} file(s)',
        duplicatesSkipped: 'Skipped {count} duplicate file(s)',
        fileRemoved: 'File removed',
        allFilesCleared: 'All files cleared',
        filesDeleted: 'Deleted {count} file(s)',
        exportSuccess: 'Package exported successfully!',
        exportFailed: 'Export failed: {error}',
        noFilesToExport: 'No files to export',

        // Export progress
        exportingPackage: 'Exporting Package',
        progress: 'Progress',
        pleaseWait: 'Please wait while we prepare your package...',
        of: 'of',
        file: 'file',
        files: 'files'
    }
};

export function getBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    return lang.startsWith('ja') ? 'ja' : 'en';
}

export function useTranslation() {
    const [language, setLanguage] = React.useState(getBrowserLanguage());

    const t = (key, params = {}) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (match, param) => params[param] || match);
        }

        return value || key;
    };

    return { t, language, setLanguage };
}
