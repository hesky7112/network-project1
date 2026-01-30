import React from 'react';
import { DiffEditor } from '@monaco-editor/react';

interface ConfigDiffViewerProps {
    original: string;
    modified: string;
    language?: string;
    height?: string | number;
}

export const ConfigDiffViewer: React.FC<ConfigDiffViewerProps> = ({
    original,
    modified,
    language = 'yaml', // Default to YAML or generic config
    height = '500px'
}) => {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-600">Original (Backup)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-600">Modified (Current)</span>
                    </div>
                </div>
            </div>
            <DiffEditor
                height={height}
                language={language}
                original={original}
                modified={modified}
                options={{
                    renderSideBySide: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    readOnly: true
                }}
                theme="light"
            />
        </div>
    );
};
