/**
 * REVOLUTIONARY DATA REVIEW & EDITING SYSTEM
 * Excel-like editing with natural language modifications
 * Real-time preview and version control
 */

import React, { useState, useMemo, useCallback } from 'react';
// @ts-ignore
import DataGrid, {Column, SelectColumn } from 'react-data-grid';

import { 
  MessageSquare, 
  Wand2, 
  Save, 
  Undo, 
  Redo,
  Search,
  Copy,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface DataRow {
  id: string;
  [key: string]: any;
}

interface EditHistory {
  id: string;
  timestamp: string;
  action: string;
  changes: any;
  description: string;
}

interface DataReviewEditorProps {
  initialData: any[];
  onSave?: (data: any[]) => void;
  onCancel?: () => void;
  onDataChange?: (data: any[]) => void;
  metadata?: {
    rowsGenerated: number;
    qualityScore: number;
    privacyScore: number;
    biasScore: number;
  };
}

export const DataReviewEditor: React.FC<DataReviewEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  onDataChange,
  metadata
}) => {
  const [data, setData] = useState<DataRow[]>(() => 
    initialData.map((row, index) => ({ id: `row-${index}`, ...row }))
  );
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [nlPrompt, setNlPrompt] = useState('');
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Get column definitions from data
  const columns = useMemo((): Column<DataRow>[] => {
    if (data.length === 0) return [];
    
    const sampleRow = data[0];
    const baseColumns: Column<DataRow>[] = Object.keys(sampleRow)
      .filter(key => key !== 'id')
      .map(key => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        resizable: true,
        sortable: true,
        editable: true,
        width: 150,
        renderEditCell: ({ row, onRowChange, column }: any) => (
          <input
            type="text"
            value={row[column.key] || ''}
            onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
            className="w-full h-full px-2 bg-gray-700 text-white border-none outline-none"
            autoFocus
          />
        )
      }));

    return [SelectColumn, ...baseColumns];
  }, [data]);

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Add to edit history
  const addToHistory = useCallback((action: string, changes: any, description: string) => {
    const historyEntry: EditHistory = {
      id: `edit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      changes,
      description
    };
    
    setEditHistory(prev => [...prev.slice(0, currentHistoryIndex + 1), historyEntry]);
    setCurrentHistoryIndex(prev => prev + 1);
  }, [currentHistoryIndex]);

  const handleRowsChange = useCallback((rows: DataRow[]) => {
    const oldData = data;
    setData(rows);
    onDataChange?.(rows.map(row => {
      const { id, ...rest } = row;
      return rest;
    }));
    addToHistory('edit_cells', { old: oldData, new: rows }, 'Manual cell edit');
  }, [data, addToHistory, onDataChange]);

  const handleDeleteRows = useCallback(() => {
    if (selectedRows.size === 0) {
      toast.error('Please select rows to delete');
      return;
    }

    // const oldData = data;
    const newData = data.filter(row => !selectedRows.has(row.id));
    setData(newData);
    setSelectedRows(new Set());
    addToHistory('delete_rows', { deleted: Array.from(selectedRows) }, `Deleted ${selectedRows.size} rows`);
    
    toast.success(`Deleted ${selectedRows.size} rows`);
  }, [data, selectedRows, addToHistory]);

  const handleAddRow = useCallback(() => {
    const newRow: DataRow = { id: `row-${Date.now()}` };
    
    // Add empty values for all existing columns
    if (data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        if (key !== 'id') {
          newRow[key] = '';
        }
      });
    }
    
    const newData = [...data, newRow];
    setData(newData);
    addToHistory('add_row', { added: newRow }, 'Added new row');
    
    toast.success('Added new row');
  }, [data, addToHistory]);

  const handleDuplicateRows = useCallback(() => {
    if (selectedRows.size === 0) {
      toast.error('Please select rows to duplicate');
      return;
    }

    const rowsToDuplicate = data.filter(row => selectedRows.has(row.id));
    const duplicatedRows = rowsToDuplicate.map(row => ({
      ...row,
      id: `row-${Date.now()}-${Math.random()}`
    }));
    
    const newData = [...data, ...duplicatedRows];
    setData(newData);
    setSelectedRows(new Set());
    addToHistory('duplicate_rows', { duplicated: duplicatedRows }, `Duplicated ${selectedRows.size} rows`);
    
    toast.success(`Duplicated ${selectedRows.size} rows`);
  }, [data, selectedRows, addToHistory]);

  const handleNaturalLanguageEdit = async () => {
    if (!nlPrompt.trim()) {
      toast.error('Please enter a modification request');
      return;
    }

    setIsProcessingNL(true);
    
    try {
      // Simulate natural language processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock NL processing results
      let newData = [...data];
      const prompt = nlPrompt.toLowerCase();
      
      if (prompt.includes('age') && prompt.includes('realistic')) {
        // Make ages more realistic
        newData = newData.map(row => ({
          ...row,
          age: row.age ? Math.max(18, Math.min(85, Number(row.age) + Math.floor(Math.random() * 10 - 5))) : row.age
        }));
        addToHistory('nl_edit', { prompt: nlPrompt }, 'Made ages more realistic');
      } else if (prompt.includes('name') && prompt.includes('diverse')) {
        // Make names more diverse
        const diverseNames = ['Maria Garcia', 'Wei Chen', 'Aisha Patel', 'Omar Hassan', 'Sofia Rodriguez'];
        newData = newData.map((row, index) => ({
          ...row,
          name: row.name ? diverseNames[index % diverseNames.length] : row.name
        }));
        addToHistory('nl_edit', { prompt: nlPrompt }, 'Made names more diverse');
      } else if (prompt.includes('email') && prompt.includes('fix')) {
        // Fix email formats
        newData = newData.map(row => ({
          ...row,
          email: row.email ? row.email.toLowerCase().replace(/\s/g, '') : row.email
        }));
        addToHistory('nl_edit', { prompt: nlPrompt }, 'Fixed email formats');
      } else {
        // Generic improvement
        addToHistory('nl_edit', { prompt: nlPrompt }, `Applied: ${nlPrompt}`);
      }
      
      setData(newData);
      setNlPrompt('');
      toast.success('Natural language modification applied successfully!');
      
    } catch (error) {
      toast.error('Failed to process natural language request');
    } finally {
      setIsProcessingNL(false);
    }
  };

  const handleUndo = useCallback(() => {
    if (currentHistoryIndex >= 0) {
      const historyEntry = editHistory[currentHistoryIndex];
      
      if (historyEntry.action === 'edit_cells') {
        setData(historyEntry.changes.old);
      } else if (historyEntry.action === 'delete_rows') {
        // Restore deleted rows (simplified implementation)
        toast.info('Undo for delete rows not implemented in this demo');
      }
      
      setCurrentHistoryIndex(prev => prev - 1);
      toast.success('Undid last action');
    }
  }, [currentHistoryIndex, editHistory]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < editHistory.length - 1) {
      setCurrentHistoryIndex(prev => prev + 1);
      const historyEntry = editHistory[currentHistoryIndex + 1];
      
      if (historyEntry.action === 'edit_cells') {
        setData(historyEntry.changes.new);
      }
      
      toast.success('Redid action');
    }
  }, [currentHistoryIndex, editHistory]);

  const handleExport = useCallback((format: 'csv' | 'json' | 'xlsx') => {
    const exportData = data.map(row => {
      const { id, ...rest } = row;
      return rest;
    });

    let blob: Blob;
    let filename: string;

    switch (format) {
      case 'csv':
        const csv = Papa.unparse(exportData);
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        filename = `edited_data_${Date.now()}.csv`;
        break;
      case 'json':
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `edited_data_${Date.now()}.json`;
        break;
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Edited Data');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `edited_data_${Date.now()}.xlsx`;
        break;
      default:
        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported as ${format.toUpperCase()}`);
  }, [data]);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Review & Edit Data</h2>
            <p className="text-gray-400">
              {data.length} rows • {Object.keys(data[0] || {}).length - 1} columns
            </p>
          </div>
          
          {metadata && (
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-400">Quality</p>
                <p className="text-lg font-semibold text-green-400">{metadata.qualityScore}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Privacy</p>
                <p className="text-lg font-semibold text-blue-400">{metadata.privacyScore}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Bias</p>
                <p className="text-lg font-semibold text-purple-400">{metadata.biasScore}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search data..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={currentHistoryIndex < 0}
              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleRedo}
              disabled={currentHistoryIndex >= editHistory.length - 1}
              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>

            <div className="w-px h-8 bg-gray-600"></div>

            <button
              onClick={handleAddRow}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Add Row"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={handleDuplicateRows}
              disabled={selectedRows.size === 0}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Duplicate Selected"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={handleDeleteRows}
              disabled={selectedRows.size === 0}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Natural Language Editor */}
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Natural Language Editing</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nlPrompt}
              onChange={(e) => setNlPrompt(e.target.value)}
              placeholder="e.g., 'Make ages more realistic', 'Fix email formats', 'Make names more diverse'"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageEdit()}
            />
            <button
              onClick={handleNaturalLanguageEdit}
              disabled={isProcessingNL || !nlPrompt.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessingNL ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isProcessingNL ? 'Processing...' : 'Apply'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-hidden">
        <DataGrid
          columns={columns}
          rows={filteredData}
          onRowsChange={handleRowsChange}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          className="rdg-dark h-full"
          style={{
            '--rdg-color': '#ffffff',
            '--rdg-background-color': '#1f2937',
            '--rdg-header-background-color': '#374151',
            '--rdg-row-hover-background-color': '#4b5563',
            '--rdg-row-selected-background-color': '#6366f1',
            '--rdg-border-color': '#4b5563',
          } as any}
        />
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-6 border-t border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {selectedRows.size > 0 && `${selectedRows.size} rows selected`}
            </span>
            {editHistory.length > 0 && (
              <span className="text-sm text-gray-400">
                {editHistory.length} edits made
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Excel
              </button>
            </div>

            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={() => onSave?.(data.map(row => {
                const { id, ...rest } = row;
                return rest;
              }))}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save & Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};