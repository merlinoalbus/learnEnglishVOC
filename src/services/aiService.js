// =====================================================
// 📁 src/services/aiService.js - Gemini AI Integration Service (VERSIONE SICURA)
// =====================================================

import AppConfig, { ERROR_MESSAGES, isAIAvailable } from '../config/appConfig';
import { CATEGORIES } from '../constants/appConstants';

/**
 * AI Service per Gemini API integration
 * SICURO: API key ora da environment variable invece di hardcoded
 */
class AIService {
  constructor() {
    // Ottieni configurazione da AppConfig (sicuro)
    this.config = AppConfig.ai;
    this.initializeService();
  }

  /**
   * Initialize service e verifica configurazione
   */
  initializeService() {
    this.isConfigured = !!this.config.apiKey;
    this.canUseAI = isAIAvailable();
    
    if (AppConfig.app.environment === 'development') {
      console.log('🤖 AI Service Status:', {
        configured: this.isConfigured,
        canUseAI: this.canUseAI,
        apiKeyPresent: !!this.config.apiKey
      });
      
      if (!this.isConfigured) {
        console.warn(
          '⚠️ AI Service: API key non configurata.\n' +
          'Aggiungi REACT_APP_GEMINI_API_KEY=your_api_key_here in .env.local'
        );
      }
    }
  }

  /**
   * Build the API URL with API key
   * @returns {string} Complete API URL
   */
  getApiUrl() {
    if (!this.config.apiKey) {
      throw new Error('API key non configurata');
    }
    return `${this.config.baseUrl}?key=${this.config.apiKey}`;
  }

  /**
   * Word categorization fallback (identica alla tua funzione originale)
   * @param {string} word - English word to categorize
   * @returns {string} Category name
   */
  categorizeWordFallback(word) {
    const wordLower = word.toLowerCase();
    
    // Pattern per verbi comuni (identico al tuo codice)
    if (wordLower.match(/^(go|come|run|walk|eat|drink|sleep|work|play|study|read|write|speak|listen|watch|see|look|think|know|understand|love|like|hate|want|need|have|get|give|take|make|do|say|tell|ask|answer|help|try|start|stop|finish|continue|learn|teach|buy|sell|pay|cost|travel|visit)$/)) {
      return 'VERBI';
    }
    
    // Pattern per verbi irregolari comuni (identico al tuo codice)
    if (wordLower.match(/^(be|have|do|say|get|make|go|know|take|see|come|think|look|want|give|use|find|tell|ask|seem|feel|try|leave|call|put|mean|become|show|hear|let|begin|keep|start|grow|open|walk|win|talk|turn|move|live|believe|bring|happen|write|sit|stand|lose|pay|meet|run|drive|break|speak|eat|fall|catch|buy|cut|rise|send|choose|build|draw|kill|wear|beat|hide|shake|hang|strike|throw|fly|steal|lie|lay|bet|bite|blow|burn|burst|cost|deal|dig|dive|fight|fit|flee|forget|forgive|freeze|hurt|kneel|lead|lend|light|quit|ride|ring|seek|sell|shoot|shut|sing|sink|slide|spin|split|spread|spring|stick|sting|stink|strike|swear|sweep|swim|swing|tear|wake|weep|wind)$/)) {
      return 'VERBI_IRREGOLARI';
    }
    
    // Pattern per aggettivi (identico al tuo codice)
    if (wordLower.match(/^.*(ful|less|ous|ive|able|ible|ant|ent|ing|ed|er|est|ly)$/) || 
        wordLower.match(/^(good|bad|big|small|new|old|young|beautiful|ugly|happy|sad|angry|excited|tired|hungry|thirsty|hot|cold|warm|cool|fast|slow|easy|difficult|hard|soft|loud|quiet|bright|dark|clean|dirty|rich|poor|healthy|sick|strong|weak|tall|short|fat|thin|heavy|light|full|empty|open|close)$/)) {
      return 'AGGETTIVI';
    }
    
    // Pattern per tecnologia (identico al tuo codice)
    if (wordLower.match(/^(computer|phone|internet|website|email|software|app|technology|digital|online|smartphone|laptop|tablet|keyboard|mouse|screen|monitor|camera|video|audio|wifi|bluetooth|data|file|download|upload|social|media|network|server|database|code|programming|artificial|intelligence|robot|smart|virtual|cloud|cyber|tech|device|gadget|electronic|battery|charge|wireless)$/)) {
      return 'TECNOLOGIA';
    }
    
    // Pattern per famiglia (identico al tuo codice)
    if (wordLower.match(/^(mother|father|mom|dad|parent|child|children|son|daughter|brother|sister|family|grandmother|grandfather|grandma|grandpa|uncle|aunt|cousin|nephew|niece|husband|wife|spouse|baby|toddler|teenager|adult|relative|generation)$/)) {
      return 'FAMIGLIA';
    }
    
    // Pattern per emozioni positive (identico al tuo codice)
    if (wordLower.match(/^(happy|joy|love|excited|cheerful|delighted|pleased|satisfied|content|glad|grateful|optimistic|positive|hopeful|confident|proud|amazed|wonderful|fantastic|excellent|great|awesome|brilliant|perfect|beautiful|amazing|incredible|outstanding|superb|marvelous|terrific)$/)) {
      return 'EMOZIONI_POSITIVE';
    }
    
    // Pattern per emozioni negative (identico al tuo codice)
    if (wordLower.match(/^(sad|angry|mad|furious|upset|disappointed|frustrated|worried|anxious|nervous|scared|afraid|terrified|depressed|lonely|jealous|envious|guilty|ashamed|embarrassed|confused|stressed|tired|exhausted|bored|annoyed|irritated|disgusted|horrible|terrible|awful|bad|worst|hate|dislike)$/)) {
      return 'EMOZIONI_NEGATIVE';
    }
    
    // Pattern per lavoro (identico al tuo codice)
    if (wordLower.match(/^(job|work|career|profession|office|business|company|manager|employee|boss|colleague|team|meeting|project|task|salary|money|contract|interview|resume|skill|experience|training|promotion|department|client|customer|service|industry|market|economy|trade|commerce)$/)) {
      return 'LAVORO';
    }
    
    // Pattern per vestiti (identico al tuo codice)
    if (wordLower.match(/^(shirt|pants|dress|skirt|jacket|coat|sweater|hoodie|jeans|shorts|socks|shoes|boots|sneakers|sandals|hat|cap|gloves|scarf|belt|tie|suit|uniform|clothes|clothing|fashion|style|wear|outfit|underwear|pajamas|swimsuit)$/)) {
      return 'VESTITI';
    }
    
    // Default: prova a determinare se è un sostantivo (identico al tuo codice)
    return 'SOSTANTIVI';
  }

  /**
   * Build Gemini API prompt (identico al tuo prompt)
   * @param {string} englishWord - English word to analyze
   * @returns {string} Complete prompt
   */
  buildPrompt(englishWord) {
    const groupsList = CATEGORIES.join(', ');
    
    return `
Analizza la parola inglese "${englishWord}" e fornisci le seguenti informazioni in formato JSON:

{
  "italian": "traduzione principale in italiano (solo la traduzione più comune)",
  "group": "DEVE essere esattamente una di queste categorie: ${groupsList}. Scegli quella più appropriata per la parola.",
  "sentence": "frase d'esempio in inglese che usa la parola",
  "notes": "note aggiuntive con altre traduzioni, sinonimi, forme irregolari, etc. Formatta come: 'Altri Significati: ... Sinonimi: ... Verbo Irregolare: ... etc.'",
  "chapter": "lascia vuoto, sarà compilato dall'utente"
}

REGOLE IMPORTANTI:
- Rispondi SOLO con il JSON valido, nessun altro testo
- Il campo "group" DEVE essere esattamente una di queste opzioni: ${groupsList}
- Per i verbi irregolari, usa "VERBI_IRREGOLARI" e specifica le forme nel campo notes
- Per verbi regolari, usa "VERBI"
- Includi sempre almeno 2-3 significati alternativi nelle note se esistono
- La frase deve essere semplice e chiara
- Il campo "chapter" deve rimanere vuoto (stringa vuota)
- Se la parola non si adatta perfettamente a nessuna categoria, scegli quella più vicina

ESEMPI:
- "run" → group: "VERBI_IRREGOLARI" 
- "beautiful" → group: "AGGETTIVI"
- "computer" → group: "TECNOLOGIA"
- "father" → group: "FAMIGLIA"
- "happy" → group: "EMOZIONI_POSITIVE"
`;
  }

  /**
   * Sleep utility for retry delays (identico al tuo codice)
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request to Gemini API with retries (identico al tuo codice)
   * @param {string} prompt - Prompt to send to AI
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} API response
   */
  async makeRequest(prompt, attempt = 1) {
    if (!this.isConfigured) {
      throw new Error('API key non configurata. Aggiungi REACT_APP_GEMINI_API_KEY in .env.local');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response structure');
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle timeout (identico al tuo codice)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      // Handle network errors with retry (identico al tuo codice)
      if (attempt < this.config.maxRetries && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('timeout')
      )) {
        await this.sleep(this.config.retryDelay * attempt); // Exponential backoff
        return this.makeRequest(prompt, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Parse and validate AI response (identico al tuo codice)
   * @param {string} content - Raw AI response content
   * @param {string} fallbackWord - Original word for fallback categorization
   * @returns {Object} Parsed and validated word data
   */
  parseAIResponse(content, fallbackWord) {
    try {
      // Extract JSON from the response (identico al tuo codice)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate required fields (identico al tuo codice)
      if (!parsedData.italian) {
        throw new Error('Missing italian translation in AI response');
      }

      // Validate category: must be one of predefined categories (identico al tuo codice)
      if (parsedData.group && !CATEGORIES.includes(parsedData.group)) {
        parsedData.group = this.categorizeWordFallback(fallbackWord);
      }

      // Set default group if missing (identico al tuo codice)
      if (!parsedData.group) {
        parsedData.group = this.categorizeWordFallback(fallbackWord);
      }

      // Ensure chapter is empty string (identico al tuo codice)
      parsedData.chapter = parsedData.chapter || '';

      // Validate data integrity (identico al tuo codice)
      return {
        italian: parsedData.italian?.trim() || '',
        group: parsedData.group,
        sentence: parsedData.sentence?.trim() || '',
        notes: parsedData.notes?.trim() || '',
        chapter: ''
      };

    } catch (error) {
      
      // Fallback: return minimal data with categorization (identico al tuo codice)
      return {
        italian: '',
        group: this.categorizeWordFallback(fallbackWord),
        sentence: '',
        notes: 'AI parsing failed. Please fill manually.',
        chapter: ''
      };
    }
  }

  /**
   * Main method: Call Gemini API to analyze a word (identico al tuo codice)
   * @param {string} englishWord - English word to analyze
   * @returns {Promise<Object>} Word analysis data
   */
  async analyzeWord(englishWord) {
    if (!englishWord || typeof englishWord !== 'string') {
      throw new Error('Valid English word is required');
    }

    const trimmedWord = englishWord.trim();
    if (!trimmedWord) {
      throw new Error('English word cannot be empty');
    }

    try {
      // Build prompt (identico al tuo codice)
      const prompt = this.buildPrompt(trimmedWord);
      
      // Make API request (identico al tuo codice)
      const apiResponse = await this.makeRequest(prompt);
      
      // Extract content (identico al tuo codice)
      const content = apiResponse.candidates[0].content.parts[0].text;
      
      // Parse and validate response (identico al tuo codice)
      const wordData = this.parseAIResponse(content, trimmedWord);

      return wordData;

    } catch (error) {      
      // Re-throw with user-friendly message (identico al tuo codice)
      if (error.message.includes('timeout')) {
        throw new Error(ERROR_MESSAGES.network);
      } else if (error.message.includes('API Error')) {
        throw new Error(ERROR_MESSAGES.ai);
      } else {
        throw new Error(`AI Error: ${error.message}`);
      }
    }
  }

  /**
   * Quick category prediction without full analysis (identico al tuo codice)
   * @param {string} englishWord - English word to categorize
   * @returns {string} Predicted category
   */
  quickCategorize(englishWord) {
    if (!englishWord || typeof englishWord !== 'string') {
      return 'SOSTANTIVI';
    }
    
    return this.categorizeWordFallback(englishWord.trim());
  }

  /**
   * Check if AI service is available (identico al tuo codice)
   * @returns {Promise<boolean>} Service availability
   */
  async isAvailable() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // Simple test request (identico al tuo codice)
      const testResponse = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'test' }] }]
        })
      });
      
      return testResponse.ok || testResponse.status === 400; // 400 is OK, means API is responsive
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service status information (identico al tuo codice)
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      apiUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      categories: CATEGORIES.length
    };
  }
}

// Create and export singleton instance (identico al tuo codice)
const aiService = new AIService();

export { aiService };
export default aiService;