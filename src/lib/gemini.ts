
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Validate Gemini API key
function validateGeminiConfig() {
  if (!apiKey) {
    console.warn('⚠️ Gemini API key not found. AI features will be limited.');
    return false;
  }
  
  if (apiKey.includes('your_gemini') || apiKey === 'your_gemini_api_key') {
    console.warn(`
🔧 Gemini API Key Required for AI Features!

To enable AI features:
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to .env file:
   VITE_GEMINI_API_KEY=your-actual-api-key

AI features will be limited until configured.
    `);
    return false;
  }
  
  return true;
}

const isGeminiConfigured = validateGeminiConfig();

let genAI: GoogleGenerativeAI | null = null;

if (isGeminiConfigured && apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }
}

export class GeminiService {
  private model = genAI?.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }) || null;

  async analyzeDataSchema(data: any[]) {
    if (!this.model) {
      throw new Error('Gemini AI not configured. Please set up your API key to use AI features.');
    }

    const prompt = `
      Analyze this dataset schema and provide insights:
      ${JSON.stringify(data.slice(0, 5), null, 2)}
      
      Please provide:
      1. Data types for each column
      2. Potential relationships between columns
      3. Data quality assessment
      4. Suggestions for synthetic data generation
      5. Domain classification (healthcare, finance, retail, etc.)
      
      Return the response as JSON with the following structure:
      {
        "schema": {...},
        "relationships": [...],
        "quality": {...},
        "domain": "...",
        "suggestions": [...]
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to analyze schema with Gemini:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSyntheticData(schema: any, config: any) {
    if (!this.model) {
      throw new Error('Gemini AI not configured. Please set up your API key to use AI features.');
    }

    // Cap row count at 100 for quota management
    const rowCount = Math.min(config.rowCount || 100, 100);

    const prompt = `
      Generate ${rowCount} rows of realistic synthetic data based on this schema and configuration:
      Schema: ${JSON.stringify(schema)}
      Config: ${JSON.stringify({...config, rowCount})}
      
      Generate realistic synthetic data that:
      1. Maintains statistical properties of the original data
      2. Preserves relationships between columns
      3. Ensures privacy (no real personal data)
      4. Follows domain-specific patterns
      5. Uses authentic values (NO placeholder text like "Sample X")
      
      Return as JSON array of ${rowCount} objects.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to generate synthetic data with Gemini:', error);
      throw new Error(`AI data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detectBias(data: any[]) {
    if (!this.model) {
      throw new Error('Gemini AI not configured. Please set up your API key to use AI features.');
    }

    const prompt = `
      Analyze this dataset for potential bias:
      ${JSON.stringify(data.slice(0, 10), null, 2)}
      
      Look for:
      1. Demographic bias
      2. Selection bias
      3. Confirmation bias
      4. Historical bias
      5. Representation bias
      
      Provide a bias score (0-100) and recommendations for mitigation.
      Return as JSON: {"biasScore": number, "biasTypes": [], "recommendations": []}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to analyze bias with Gemini:', error);
      throw new Error(`AI bias analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async assessPrivacy(data: any[]) {
    if (!this.model) {
      throw new Error('Gemini AI not configured. Please set up your API key to use AI features.');
    }

    const prompt = `
      Assess privacy risks in this dataset:
      ${JSON.stringify(data.slice(0, 5), null, 2)}
      
      Check for:
      1. PII (Personally Identifiable Information)
      2. Sensitive attributes
      3. Re-identification risks
      4. Data linkage possibilities
      
      Provide privacy score (0-100) and recommendations.
      Return as JSON: {"privacyScore": number, "risks": [], "recommendations": []}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to assess privacy with Gemini:', error);
      throw new Error(`AI privacy assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSchemaFromNaturalLanguage(
    description: string,
    domain: string = 'general',
    dataType: string = 'tabular'
  ) {
    if (!this.model) {
      throw new Error('Gemini AI not configured. Please set up your API key to use AI features.');
    }

    const prompt = `
      Based on this natural language description, generate a detailed database schema:
      
      Description: "${description}"
      Domain: ${domain}
      Data Type: ${dataType}
      
      Please analyze the description and create a comprehensive schema that includes:
      
      1. Field names that match the described data
      2. Appropriate data types (string, number, boolean, date, email, phone, etc.)
      3. Constraints where applicable (min/max values, required fields)
      4. Sample values or examples for each field
      5. Relationships between fields if applicable
      6. Domain-specific field suggestions
      
      Return the response as JSON with this exact structure:
      {
        "schema": {
          "field_name": {
            "type": "string|number|boolean|date|datetime|email|phone|uuid|text",
            "description": "Clear description of the field",
            "constraints": {
              "min": number,
              "max": number,
              "required": boolean,
              "unique": boolean
            },
            "examples": ["example1", "example2", "example3"]
          }
        },
        "detectedDomain": "detected_domain_from_description",
        "estimatedRows": 100,
        "relationships": ["description of data relationships"],
        "suggestions": ["suggestions for data generation"]
      }
      
      Make sure the schema is realistic and comprehensive for the described use case.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      let text = response.text();
      
      // Clean up the response
      if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0];
      } else if (text.includes('```')) {
        text = text.split('```')[1];
      }
      
      text = text.trim();
      
      const parsed = JSON.parse(text);
      
      // Validate and enhance the schema
      if (!parsed.schema) {
        throw new Error('Invalid schema format');
      }
      
      return {
        schema: parsed.schema,
        detectedDomain: parsed.detectedDomain || domain,
        estimatedRows: parsed.estimatedRows || 100,
        relationships: parsed.relationships || [],
        suggestions: parsed.suggestions || []
      };
      
    } catch (error) {
      console.error('Failed to generate schema from natural language:', error);
      throw new Error(`AI schema generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSyntheticDataFromSchema(
    schema: any, 
    config: any, 
    description: string = ""
  ): Promise<any[]> {
    if (!this.model) {
      throw new Error('Gemini AI not configured. Please set up your API key to use AI features.');
    }

    // Cap row count at 100 for quota management
    const rowCount = Math.min(config.rowCount || 100, 100);

    const prompt = `
      Generate ${rowCount} rows of realistic synthetic data based on this schema:
      
      Schema: ${JSON.stringify(schema, null, 2)}
      Original Description: "${description}"
      Configuration: ${JSON.stringify({...config, rowCount}, null, 2)}
      
      Generate data that:
      1. Follows the exact schema structure
      2. Uses realistic values for each field type
      3. Maintains data relationships and constraints
      4. Ensures variety and realistic distribution
      5. Follows domain-specific patterns when applicable
      6. NO placeholder text like "Sample X" or generic patterns
      
      Return as a JSON array of ${rowCount} objects.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      let text = response.text();
      
      // Clean and parse JSON
      if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0];
      } else if (text.includes('```')) {
        text = text.split('```')[1];
      }
      
      text = text.trim();
      const data = JSON.parse(text);
      
      if (Array.isArray(data) && data.length > 0) {
        return data.slice(0, rowCount);
      } else {
        throw new Error('Invalid data format returned');
      }
    } catch (error) {
      console.error('Failed to generate synthetic data from schema:', error);
      throw new Error(`AI data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
