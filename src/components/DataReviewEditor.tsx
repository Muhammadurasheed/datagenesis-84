import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  RotateCcw,
  Sparkles,
  MessageSquare,
  Wand2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface DataReviewEditorProps {
  data: any[];
  onDataUpdate: (updatedData: any[]) => void;
  onPromptEdit: (prompt: string) => void;
  isEditing?: boolean;
}

const DataReviewEditor: React.FC<DataReviewEditorProps> = ({
  data,
  onDataUpdate,
  onPromptEdit,
  isEditing = false
}) => {
  const [editMode, setEditMode] = useState<'manual' | 'prompt' | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [promptText, setPromptText] = useState('');
  const [localData, setLocalData] = useState(data);

  const handleCellEdit = (rowIndex: number, field: string, currentValue: any) => {
    setEditingRow(rowIndex);
    setEditingField(field);
    setEditValue(String(currentValue));
  };

  const handleCellSave = () => {
    if (editingRow !== null && editingField !== null) {
      const updatedData = [...localData];
      updatedData[editingRow][editingField] = editValue;
      setLocalData(updatedData);
      onDataUpdate(updatedData);
      
      setEditingRow(null);
      setEditingField(null);
      setEditValue('');
      toast.success('Cell updated successfully');
    }
  };

  const handleCellCancel = () => {
    setEditingRow(null);
    setEditingField(null);
    setEditValue('');
  };

  const handleRowDelete = (rowIndex: number) => {
    const updatedData = localData.filter((_, index) => index !== rowIndex);
    setLocalData(updatedData);
    onDataUpdate(updatedData);
    toast.success('Row deleted successfully');
  };

  const handleAddRow = () => {
    if (localData.length === 0) return;
    
    const newRow = Object.keys(localData[0]).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {} as any);
    
    const updatedData = [...localData, newRow];
    setLocalData(updatedData);
    onDataUpdate(updatedData);
    toast.success('New row added');
  };

  const handlePromptSubmit = () => {
    if (promptText.trim()) {
      onPromptEdit(promptText);
      setPromptText('');
      setEditMode(null);
      toast.success('Regenerating data with your changes...');
    }
  };

  const resetData = () => {
    setLocalData(data);
    onDataUpdate(data);
    toast.success('Data reset to original');
  };

  if (localData.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No data to review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Data Review & Editor</h3>
          <p className="text-gray-400">Review and edit your generated data</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(editMode === 'manual' ? null : 'manual')}
            className={`border-blue-500/30 ${editMode === 'manual' ? 'bg-blue-500/20' : 'hover:bg-blue-500/20'}`}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Manual Edit
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(editMode === 'prompt' ? null : 'prompt')}
            className={`border-purple-500/30 ${editMode === 'prompt' ? 'bg-purple-500/20' : 'hover:bg-purple-500/20'}`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Edit with AI
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetData}
            className="border-orange-500/30 hover:bg-orange-500/20"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* AI Prompt Editor */}
      {editMode === 'prompt' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wand2 className="w-5 h-5 text-purple-400" />
                AI-Powered Data Editing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe how you'd like to modify the data... e.g., 'Make the ages more diverse', 'Add more variety to the names', 'Increase salary ranges'"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePromptSubmit}
                  disabled={!promptText.trim() || isEditing}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isEditing ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Apply AI Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(null)}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Data Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            Data Table ({localData.length} rows)
          </CardTitle>
          {editMode === 'manual' && (
            <Button
              size="sm"
              onClick={handleAddRow}
              className="bg-green-500 hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-700/50 sticky top-0">
                <tr>
                  {editMode === 'manual' && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-20">
                      Actions
                    </th>
                  )}
                  {Object.keys(localData[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-gray-700/50 hover:bg-gray-700/20">
                    {editMode === 'manual' && (
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRowDelete(rowIndex)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    )}
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="px-4 py-3">
                        {editMode === 'manual' && editingRow === rowIndex && editingField === key ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 text-sm bg-gray-700 border-gray-600"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={handleCellSave}
                              className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCellCancel}
                              className="h-6 w-6 p-0 border-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className={`text-sm text-gray-300 ${
                              editMode === 'manual' ? 'cursor-pointer hover:bg-gray-600/50 px-2 py-1 rounded' : ''
                            }`}
                            onClick={() => editMode === 'manual' && handleCellEdit(rowIndex, key, value)}
                          >
                            {String(value).length > 50 
                              ? `${String(value).substring(0, 50)}...` 
                              : String(value) || '-'
                            }
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <Badge variant="outline" className="border-gray-600">
          {localData.length} rows
        </Badge>
        <Badge variant="outline" className="border-gray-600">
          {Object.keys(localData[0] || {}).length} columns
        </Badge>
        {editMode && (
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            Edit mode active
          </Badge>
        )}
      </div>
    </div>
  );
};

export default DataReviewEditor;