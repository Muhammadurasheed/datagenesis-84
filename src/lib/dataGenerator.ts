import { ApiService } from './api';

// Enhanced interfaces with comprehensive options
export interface DataGenerationOptions {
  domain: string;
  numRows: number;
  format: 'json' | 'csv';
  schema: Record<string, { type: string; constraints?: any }>;
}

export interface GenerationResult {
  data: any[];
  metadata: {
    rowCount: number;
    columns: string[];
    generationTime: number;
    format: string;
  };
}

export interface DatasetGenerationOptions {
  domain: string;
  data_type: string;
  sourceData?: any[];
  schema?: any;
  description?: string;
  isGuest?: boolean;
  rowCount?: number;
  quality_level?: string;
  privacy_level?: string;
}

export class DataGeneratorService {
  
  async processUploadedData(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          let data: any[] = [];
          
          if (file.name.endsWith('.json')) {
            data = JSON.parse(text);
          } else if (file.name.endsWith('.csv')) {
            data = this.parseCSV(text);
          } else {
            throw new Error('Unsupported file format');
          }
          
          // Better validation for different data formats
          if (!data) {
            throw new Error('File contains no data');
          }
          
          // Handle single object (convert to array)
          if (typeof data === 'object' && !Array.isArray(data)) {
            data = [data];
          }
          
          // Final validation
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('File contains no valid tabular data');
          }
          
          const schema = this.inferSchema(data);
          const stats = this.calculateStats(data);
          
          resolve({
            data: data.slice(0, 1000), // Limit for analysis
            schema,
            stats,
            totalRows: data.length
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async generateSchemaFromDescription(description: string, domain: string, dataType: string): Promise<any> {
    try {
      // Use the enhanced API service - NO FALLBACKS
      const result = await ApiService.generateSchemaFromDescription({
        description,
        domain,
        data_type: dataType
      });
      
      // Validate the response
      if (!result || !result.schema || Object.keys(result.schema).length === 0) {
        throw new Error('Invalid schema received from backend');
      }
      
      return result;
    } catch (error) {
      console.error('Schema generation failed:', error);
      throw new Error(`Schema generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API configuration.`);
    }
  }

  async generateSyntheticDataset(options: DatasetGenerationOptions): Promise<any> {
    try {
      // Set default row count to 100 and cap at 100
      const rowCount = Math.min(options.rowCount || 100, 100);
      
      // Enhanced payload with proper validation
      const payload = {
        schema: options.schema || {},
        config: {
          rowCount: rowCount,
          domain: options.domain,
          data_type: options.data_type,
          quality_level: options.quality_level || 'high',
          privacy_level: options.privacy_level || 'maximum'
        },
        description: options.description || '',
        sourceData: options.sourceData || []
      };

      // Validate required fields
      if (!payload.config.domain || !payload.config.data_type) {
        throw new Error('Domain and data type are required');
      }

      console.log(`🚀 Generating ${rowCount} rows of synthetic data for ${payload.config.domain} domain...`);

      const result = await ApiService.generateSyntheticData(payload);
      
      // Enhanced validation of backend response
      if (!result || !result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid data format received from backend');
      }

      console.log(`✅ Successfully generated ${result.data.length} realistic records`);

      return {
        data: result.data,
        metadata: {
          rowsGenerated: result.data.length,
          columnsGenerated: result.data.length > 0 ? Object.keys(result.data[0]).length : 0,
          generationTime: result.metadata?.generation_time || new Date().toISOString(),
          config: payload.config,
          generationMethod: result.metadata?.generation_method || 'ai_real_time',
          aiProvider: result.metadata?.ai_provider || 'gemini_2_flash',
          qualityScore: result.quality_score || result.qualityScore || 0,
          privacyScore: result.privacy_score || result.privacyScore || 0,
          biasScore: result.bias_score || result.biasScore || 0,
          agentInsights: result.agent_insights || null
        }
      };
    } catch (error) {
      console.error('Synthetic data generation failed:', error);
      throw new Error(`Data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API configuration or try again later.`);
    }
  }

  private parseCSV(text: string): any[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have header and data rows');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  }

  private inferSchema(data: any[]): any {
    const schema: any = {};
    const sample = data[0];
    
    Object.keys(sample).forEach(key => {
      const value = sample[key];
      let type = 'string';
      
      if (typeof value === 'number') type = 'number';
      else if (typeof value === 'boolean') type = 'boolean';
      else if (value && !isNaN(Date.parse(value))) type = 'date';
      
      schema[key] = { type, description: `Auto-detected ${type} field` };
    });
    
    return schema;
  }

  private calculateStats(data: any[]): any {
    return {
      rowCount: data.length,
      columnCount: Object.keys(data[0] || {}).length,
      firstRow: data[0],
      lastRow: data[data.length - 1]
    };
  }

  async exportData(data: any[], format: string = 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    if (format === 'csv') {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(data, null, 2);
  }
}

// Keep the original function exports for backward compatibility
export const generateSyntheticData = async (
  options: DataGenerationOptions
): Promise<GenerationResult> => {
  const startTime = Date.now();

  try {
    // Make API call to backend - NO FALLBACKS
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    const generationTime = Date.now() - startTime;

    return {
      data: result.data,
      metadata: {
        rowCount: result.data.length,
        columns: Object.keys(result.data[0] || {}),
        generationTime,
        format: options.format || 'json',
      },
    };
  } catch (error) {
    console.error('Data generation error:', error);
    throw error; // Don't fall back to mock data
  }
};

export const exportData = async (data: any[], format: string = 'csv'): Promise<string> => {
  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, format }),
    });

    if (!response.ok) {
      const backendError = await response.text();
      throw new Error(`Export failed: ${backendError}`);
    }

    const result = await response.text();
    return result;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};
