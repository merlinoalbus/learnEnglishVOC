// =====================================================
// 📁 src/services/aiService.ts - NO AUTOMATIC PING VERSION
// =====================================================

import AppConfig, { isAIAvailable } from "../config/appConfig";
import { WORD_CATEGORIES } from "../types/entities/Word.types";
import { withTimeout, globalOperationManager } from "../utils/retryUtils";

// Types
interface AIAnalysisResult {
  italian: string;
  group: string;
  sentence?: string;           // DEPRECATED: per backward compatibility
  sentences?: string[];        // NUOVO: array di frasi
  synonyms?: string[];         // NUOVO: array di sinonimi
  antonyms?: string[];         // NUOVO: array di contrari
  notes: string;
  chapter: string;
  _aiError?: boolean;
  _fallbackUsed?: boolean;
}

interface AIServiceStatus {
  configured: boolean;
  health: HealthStatus;
  consecutiveFailures: number;
  lastSuccessTime: number | null;
  lastHealthCheck: number | null;
  circuitBreaker: any;
  apiUrl: string;
  timeout: number;
  canUseAI: boolean;
  degradedMode: boolean;
  recommendations: string[];
}

interface APIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

type HealthStatus = "unknown" | "healthy" | "degraded" | "down";

class AIService {
  private config: any;
  private isConfigured: boolean;
  private canUseAI: boolean;
  private lastSuccessTime: number | null;
  private consecutiveFailures: number;
  private healthStatus: HealthStatus;
  private lastHealthCheck: number | null;

  constructor() {
    this.config = AppConfig.ai;
    this.isConfigured = !!this.config.apiKey;
    this.canUseAI = isAIAvailable() || false;
    this.lastSuccessTime = null;
    this.consecutiveFailures = 0;
    this.healthStatus = "unknown";
    this.lastHealthCheck = null;
    this.initializeService();
  }

  private initializeService(): void {
    // ⭐ SMART INITIAL STATUS - NO API CALLS
    if (!this.isConfigured) {
      this.healthStatus = "down";
    } else {
      // Assume healthy until proven otherwise
      this.healthStatus = "healthy";
    }

    if (AppConfig.app.environment === "development") {
      console.log("🤖 Enhanced AI Service Status (NO AUTO-PING):", {
        configured: this.isConfigured,
        canUseAI: this.canUseAI,
        apiKeyPresent: !!this.config.apiKey,
        healthStatus: this.healthStatus,
      });
    }
  }

  // ⭐ PASSIVE HEALTH CHECK - NO API CALLS
  private checkHealthPassive(): boolean {
    if (!this.isConfigured) {
      this.healthStatus = "down";
      this.lastHealthCheck = Date.now();
      return false;
    }

    // ⭐ SMART STATUS INFERENCE based on recent activity
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // If we had recent success, assume healthy
    if (this.lastSuccessTime && this.lastSuccessTime > fiveMinutesAgo) {
      this.healthStatus = "healthy";
      this.lastHealthCheck = now;
      return true;
    }

    // If we have consecutive failures, mark as degraded/down
    if (this.consecutiveFailures > 3) {
      this.healthStatus = "down";
    } else if (this.consecutiveFailures > 1) {
      this.healthStatus = "degraded";
    } else {
      // No recent activity but configured - assume healthy
      this.healthStatus = "healthy";
    }

    this.lastHealthCheck = now;
    return this.healthStatus === "healthy";
  }

  // ⭐ REAL HEALTH CHECK - ONLY ON MANUAL REQUEST
  async checkHealthManual(): Promise<boolean> {
    if (!this.isConfigured) {
      this.healthStatus = "down";
      this.lastHealthCheck = Date.now();
      return false;
    }

    try {
      console.log("🔍 Manual AI health check (COSTS MONEY)...");

      const response = await withTimeout(
        () =>
          fetch(this.getApiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "ping" }] }],
            }),
          }),
        8000
      );

      const isHealthy = response.ok || response.status === 400;

      if (isHealthy) {
        this.healthStatus = "healthy";
        this.consecutiveFailures = 0;
        this.lastSuccessTime = Date.now();
        console.log("✅ AI service manually verified as healthy");
      } else {
        this.consecutiveFailures++;
        this.healthStatus = this.consecutiveFailures > 2 ? "down" : "degraded";
        console.log(
          "⚠️ AI service manually verified as degraded:",
          response.status
        );
      }

      this.lastHealthCheck = Date.now();
      return isHealthy;
    } catch (error) {
      this.consecutiveFailures++;

      if ((error as Error).message.includes("timeout")) {
        this.healthStatus = "degraded";
        console.log("⏱️ AI service manual timeout");
      } else if (
        (error as Error).message.includes("fetch") ||
        (error as Error).message.includes("network")
      ) {
        this.healthStatus = this.consecutiveFailures > 2 ? "down" : "degraded";
        console.log("📡 AI service manual network error");
      } else {
        this.healthStatus = this.consecutiveFailures > 3 ? "down" : "degraded";
        console.log("❌ AI service manual error:", (error as Error).message);
      }

      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  // ⭐ ANALYZE WORD - Updates health based on real usage
  async analyzeWord(englishWord: string): Promise<AIAnalysisResult> {
    if (!englishWord || typeof englishWord !== "string") {
      throw new Error("Valid English word is required");
    }

    const trimmedWord = englishWord.trim();
    if (!trimmedWord) {
      throw new Error("English word cannot be empty");
    }

    if (!this.isConfigured) {
      throw new Error(
        "AI service not configured. Add REACT_APP_GEMINI_API_KEY to .env.local"
      );
    }

    try {
      const result = await globalOperationManager.execute(
        "aiAnalysis",
        async () => await this.performAnalysis(trimmedWord)
      );

      // ⭐ UPDATE HEALTH ON REAL SUCCESS
      this.consecutiveFailures = 0;
      this.lastSuccessTime = Date.now();
      this.healthStatus = "healthy";
      console.log("✅ AI analysis successful - health updated");

      return result;
    } catch (error) {
      // ⭐ UPDATE HEALTH ON REAL FAILURE
      this.consecutiveFailures++;

      if ((error as Error).message.includes("API key") || (error as Error).message.includes("401")) {
        this.healthStatus = "down";
        throw new Error("🔑 API key non valida. Verifica configurazione.");
      } else if (
        (error as Error).message.includes("quota") ||
        (error as Error).message.includes("limit")
      ) {
        this.healthStatus = "down";
        throw new Error("🚫 Limite API raggiunto. Riprova più tardi.");
      } else if ((error as Error).message.includes("timeout")) {
        this.healthStatus = "degraded";
        throw new Error("⏱️ AI timeout. Connessione lenta.");
      } else if ((error as Error).message.includes("Circuit breaker")) {
        this.healthStatus = "down";
        throw new Error("🔴 AI temporaneamente non disponibile.");
      } else {
        this.healthStatus = this.consecutiveFailures > 2 ? "down" : "degraded";
        console.log(
          `❌ AI analysis failed - health updated to ${this.healthStatus}`
        );
        throw new Error(`🤖 Errore AI: ${(error as Error).message}`);
      }
    }
  }

  // ⭐ ANALYZE WITH FALLBACK
  async analyzeWordWithFallback(englishWord: string): Promise<AIAnalysisResult> {
    try {
      return await this.analyzeWord(englishWord);
    } catch (error) {
      console.warn("🤖 AI analysis failed, providing fallback:", (error as Error).message);

      return {
        italian: "",
        group: this.categorizeWordFallback(englishWord),
        sentence: "",
        notes: `🤖 AI non disponibile: ${(error as Error).message}. Completa manualmente.`,
        chapter: "",
        _aiError: true,
        _fallbackUsed: true,
      };
    }
  }

  // ⭐ CORE ANALYSIS
  private async performAnalysis(word: string): Promise<AIAnalysisResult> {
    const prompt = this.buildPrompt(word);
    const apiResponse = await this.makeRequest(prompt);
    const content = apiResponse.candidates[0].content.parts[0].text;
    return this.parseAIResponse(content, word);
  }

  // ⭐ MAKE REQUEST
  private async makeRequest(prompt: string): Promise<APIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.getApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
          throw new Error("API key non valida");
        } else if (response.status === 403) {
          throw new Error("Accesso negato API");
        } else if (response.status === 429) {
          throw new Error("Troppi richieste");
        } else if (response.status === 400) {
          throw new Error("Richiesta non valida");
        } else if (response.status >= 500) {
          throw new Error("Errore server Gemini");
        } else {
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Risposta API non valida");
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === "AbortError") {
        throw new Error("Request timeout");
      }

      if (
        (error as Error).message.includes("fetch") ||
        (error as Error).message.includes("network")
      ) {
        throw new Error("Errore di rete");
      }

      throw error;
    }
  }

  // ⭐ PARSE AI RESPONSE
  private parseAIResponse(content: string, fallbackWord: string): AIAnalysisResult {
    try {
      console.log("🔍 AI Raw Response:", content);
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("❌ No JSON found in AI response");
        return this.createFallbackResponse(fallbackWord, "No JSON in response");
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log("📊 AI Parsed Data:", parsedData);
      
      const result = this.validateAndSanitizeResponse(parsedData, fallbackWord);
      console.log("✅ AI Final Result:", result);
      
      return result;
    } catch (parseError) {
      console.error("❌ AI JSON Parsing Error:", parseError);
      return this.createFallbackResponse(fallbackWord, "JSON parsing failed");
    }
  }

  // ⭐ VALIDATE RESPONSE
  private validateAndSanitizeResponse(data: any, fallbackWord: string): AIAnalysisResult {
    const result: AIAnalysisResult = {
      italian: "",
      group: "",
      sentences: [],
      synonyms: [],
      antonyms: [],
      notes: "",
      chapter: "",
    };

    // Validazione traduzione italiana
    if (
      !data.italian ||
      typeof data.italian !== "string" ||
      !data.italian.trim()
    ) {
      return this.createFallbackResponse(fallbackWord, "Missing translation");
    }
    result.italian = data.italian.trim();

    // Validazione gruppo
    if (data.group && WORD_CATEGORIES.includes(data.group)) {
      result.group = data.group;
    } else {
      result.group = this.categorizeWordFallback(fallbackWord);
    }

    // Validazione frasi (NUOVO) - fallback su sentence singola per backward compatibility
    console.log("🔍 Validating sentences - data.sentences:", data.sentences, "data.sentence:", data.sentence);
    
    if (Array.isArray(data.sentences) && data.sentences.length > 0) {
      result.sentences = data.sentences
        .filter((s: any) => typeof s === "string" && s.trim())
        .map((s: string) => s.trim())
        .slice(0, 5); // Max 5 frasi
      console.log("✅ Using sentences array:", result.sentences);
    } else if (data.sentence && typeof data.sentence === "string") {
      // Backward compatibility
      result.sentences = [data.sentence.trim()];
      result.sentence = data.sentence.trim(); // Per backward compatibility
      console.log("✅ Using single sentence fallback:", result.sentences);
    } else {
      console.warn("⚠️ No sentences found in AI response!");
    }

    // Validazione sinonimi (NUOVO)
    console.log("🔍 Validating synonyms - data.synonyms:", data.synonyms);
    if (Array.isArray(data.synonyms) && data.synonyms.length > 0) {
      result.synonyms = data.synonyms
        .filter((s: any) => typeof s === "string" && s.trim())
        .map((s: string) => s.trim())
        .slice(0, 8); // Max 8 sinonimi
      console.log("✅ Using synonyms:", result.synonyms);
    } else {
      console.warn("⚠️ No synonyms found in AI response!");
    }

    // Validazione contrari (NUOVO)
    console.log("🔍 Validating antonyms - data.antonyms:", data.antonyms);
    if (Array.isArray(data.antonyms) && data.antonyms.length > 0) {
      result.antonyms = data.antonyms
        .filter((s: any) => typeof s === "string" && s.trim())
        .map((s: string) => s.trim())
        .slice(0, 8); // Max 8 contrari
      console.log("✅ Using antonyms:", result.antonyms);
    } else {
      console.warn("⚠️ No antonyms found in AI response!");
    }

    result.notes =
      data.notes && typeof data.notes === "string" ? data.notes.trim() : "";

    result.chapter = "";

    return result;
  }

  // ⭐ FALLBACK RESPONSE
  private createFallbackResponse(word: string, reason: string): AIAnalysisResult {
    return {
      italian: "",
      group: this.categorizeWordFallback(word),
      sentences: [],
      synonyms: [],
      antonyms: [],
      notes: `❌ AI analysis failed: ${reason}. Fill manually.`,
      chapter: "",
      _aiError: true,
      _fallbackUsed: true,
    };
  }

  // ⭐ BUILD PROMPT
  private buildPrompt(englishWord: string): string {
    const groupsList = WORD_CATEGORIES.join(", ");

    return `
Genera JSON per la parola inglese "${englishWord}":

{
  "italian": "traduzione principale",
  "group": "categoria esatta dalla lista",
  "sentences": [
    "Frase di esempio 1 con ${englishWord}",
    "Frase di esempio 2 con ${englishWord}",
    "Frase di esempio 3 con ${englishWord}"
  ],
  "synonyms": ["sinonimo1", "sinonimo2", "sinonimo3"],
  "antonyms": ["contrario1", "contrario2"],
  "notes": "note utili",
  "chapter": ""
}

REGOLE CRITICHE:
1. SEMPRE includere ESATTAMENTE 3 frasi nell'array "sentences"
2. SEMPRE includere almeno 3 sinonimi nell'array "synonyms"
3. Se esistono contrari, includerli nell'array "antonyms"
4. Solo JSON puro, senza testo prima o dopo
5. "group" deve essere uno di: ${groupsList}

ESEMPIO PER "${englishWord}":
Se "${englishWord}" = "check":
{
  "italian": "controllare, verificare",
  "group": "VERBI_BASE",
  "sentences": [
    "Please check your email",
    "I need to check the time",
    "The doctor will check your blood pressure"
  ],
  "synonyms": ["verify", "examine", "inspect", "review"],
  "antonyms": ["ignore", "neglect"],
  "notes": "Verbo molto comune con molteplici significati",
  "chapter": ""
}

IMPORTANTE: NON scrivere altro testo, solo il JSON!
`;
  }

  // ⭐ CATEGORIZE FALLBACK
  public categorizeWordFallback(word: string): string {
    const wordLower = word.toLowerCase();

    if (
      wordLower.match(
        /^(go|come|run|walk|eat|drink|sleep|work|play|study|read|write|speak|listen|watch|see|look|think|know|understand|love|like|hate|want|need|have|get|give|take|make|do|say|tell|ask|answer|help|try|start|stop|finish|continue|learn|teach|buy|sell|pay|cost|travel|visit)$/
      )
    ) {
      return "VERBI_BASE";
    }

    if (
      wordLower.match(
        /^(be|have|do|say|get|make|go|know|take|see|come|think|look|want|give|use|find|tell|ask|seem|feel|try|leave|call|put|mean|become|show|hear|let|begin|keep|start|grow|open|walk|win|talk|turn|move|live|believe|bring|happen|write|sit|stand|lose|pay|meet|run|drive|break|speak|eat|fall|catch|buy|cut|rise|send|choose|build|draw|kill|wear|beat|hide|shake|hang|strike|throw|fly|steal|lie|lay|bet|bite|blow|burn|burst|cost|deal|dig|dive|fight|fit|flee|forget|forgive|freeze|hurt|kneel|lead|lend|light|quit|ride|ring|seek|sell|shoot|shut|sing|sink|slide|spin|split|spread|spring|stick|sting|stink|strike|swear|sweep|swim|swing|tear|wake|weep|wind)$/
      )
    ) {
      return "VERBI_IRREGOLARI_COMUNI";
    }

    if (
      wordLower.match(
        /^.*(ful|less|ous|ive|able|ible|ant|ent|ing|ed|er|est|ly)$/
      ) ||
      wordLower.match(
        /^(good|bad|big|small|new|old|young|beautiful|ugly|happy|sad|angry|excited|tired|hungry|thirsty|hot|cold|warm|cool|fast|slow|easy|difficult|hard|soft|loud|quiet|bright|dark|clean|dirty|rich|poor|healthy|sick|strong|weak|tall|short|fat|thin|heavy|light|full|empty|open|close)$/
      )
    ) {
      return "AGGETTIVI_BASE";
    }

    if (
      wordLower.match(
        /^(computer|phone|internet|website|email|software|app|technology|digital|online|smartphone|laptop|tablet|keyboard|mouse|screen|monitor|camera|video|audio|wifi|bluetooth|data|file|download|upload|social|media|network|server|database|code|programming|artificial|intelligence|robot|smart|virtual|cloud|cyber|tech|device|gadget|electronic|battery|charge|wireless)$/
      )
    ) {
      return "TECNOLOGIA_DIGITALE";
    }

    if (
      wordLower.match(
        /^(mother|father|mom|dad|parent|child|children|son|daughter|brother|sister|family|grandmother|grandfather|grandma|grandpa|uncle|aunt|cousin|nephew|niece|husband|wife|spouse|baby|toddler|teenager|adult|relative|generation)$/
      )
    ) {
      return "FAMIGLIA_PARENTELA";
    }

    if (
      wordLower.match(
        /^(happy|joy|love|excited|cheerful|delighted|pleased|satisfied|content|glad|grateful|optimistic|positive|hopeful|confident|proud|amazed|wonderful|fantastic|excellent|great|awesome|brilliant|perfect|beautiful|amazing|incredible|outstanding|superb|marvelous|terrific)$/
      )
    ) {
      return "STATI_EMOTIVI";
    }

    if (
      wordLower.match(
        /^(sad|angry|mad|furious|upset|disappointed|frustrated|worried|anxious|nervous|scared|afraid|terrified|depressed|lonely|jealous|envious|guilty|ashamed|embarrassed|confused|stressed|tired|exhausted|bored|annoyed|irritated|disgusted|horrible|terrible|awful|bad|worst|hate|dislike)$/
      )
    ) {
      return "STATI_EMOTIVI";
    }

    if (
      wordLower.match(
        /^(job|work|career|profession|office|business|company|manager|employee|boss|colleague|team|meeting|project|task|salary|money|contract|interview|resume|skill|experience|training|promotion|department|client|customer|service|industry|market|economy|trade|commerce)$/
      )
    ) {
      return "LAVORO_PROFESSIONI";
    }

    if (
      wordLower.match(
        /^(shirt|pants|dress|skirt|jacket|coat|sweater|hoodie|jeans|shorts|socks|shoes|boots|sneakers|sandals|hat|cap|gloves|scarf|belt|tie|suit|uniform|clothes|clothing|fashion|style|wear|outfit|underwear|pajamas|swimsuit)$/
      )
    ) {
      return "VESTITI_ACCESSORI";
    }

    return "CORPO_UMANO";
  }

  private getApiUrl(): string {
    if (!this.config.apiKey) {
      throw new Error("API key non configurata");
    }
    return `${this.config.baseUrl}?key=${this.config.apiKey}`;
  }

  // ⭐ SERVICE STATUS - NO AUTOMATIC CALLS
  getServiceStatus(): AIServiceStatus {
    const circuitBreakerStatus =
      globalOperationManager.getOperationStatus("aiAnalysis");

    return {
      configured: this.isConfigured,
      health: this.healthStatus,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessTime: this.lastSuccessTime,
      lastHealthCheck: this.lastHealthCheck,
      circuitBreaker: circuitBreakerStatus?.circuitBreaker,
      apiUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      canUseAI: this.canUseAI,
      degradedMode: this.healthStatus === "degraded",
      recommendations: this.getRecommendations(),
    };
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.isConfigured) {
      recommendations.push("🔑 Configurare API key in .env.local");
    }

    if (this.healthStatus === "down") {
      recommendations.push("🔴 Servizio non disponibile. Usa modalità manuale");
    }

    if (this.healthStatus === "degraded") {
      recommendations.push("🟡 Servizio instabile. Verifica connessione");
    }

    if (this.consecutiveFailures > 2) {
      recommendations.push(
        "⚠️ Molti errori consecutivi. Controlla configurazione"
      );
    }

    return recommendations;
  }

  // ⭐ PUBLIC METHODS - NO AUTO CALLS
  quickCategorize(englishWord: string): string {
    if (!englishWord || typeof englishWord !== "string") {
      return "CORPO_UMANO";
    }
    return this.categorizeWordFallback(englishWord.trim());
  }

  // ⭐ MANUAL HEALTH CHECK ONLY
  async checkHealth(): Promise<boolean> {
    return await this.checkHealthManual();
  }

  // ⭐ PASSIVE CHECK - NO API CALLS
  isAvailable(): boolean {
    return this.checkHealthPassive();
  }

  getStatus(): AIServiceStatus {
    return this.getServiceStatus();
  }
}

const aiService = new AIService();

export { aiService };
export default aiService;