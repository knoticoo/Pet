// AI Configuration System
export interface AIConfig {
  useLocalModel: boolean
  modelEndpoint: string
  modelName: string
  useBuiltInKnowledge: boolean
  useExternalAPIs: boolean
  useDatabaseKnowledge: boolean
  enablePhotoAnalysis: boolean
  enableExpenseAnalysis: boolean
  enableVetConsultations: boolean
  openaiApiKey?: string
  googleVisionApiKey?: string
  azureComputerVisionKey?: string
  // New parameters for unique responses
  temperature: number
  topP: number
  repeatPenalty: number
  maxTokens: number
  contextLength: number
}

// Default configuration for 4GB VPS with unique response optimization
export const defaultAIConfig: AIConfig = {
  useLocalModel: process.env.AI_USE_LOCAL === 'true',
  modelEndpoint: process.env.AI_MODEL_ENDPOINT || 'http://localhost:11434',
  modelName: process.env.AI_MODEL_NAME || 'llama3.1:8b',
  useBuiltInKnowledge: false, // Disabled to force AI responses
  useExternalAPIs: process.env.AI_USE_EXTERNAL_APIS === 'true',
  useDatabaseKnowledge: true,
  enablePhotoAnalysis: true,
  enableExpenseAnalysis: true,
  enableVetConsultations: true,
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
  azureComputerVisionKey: process.env.AZURE_COMPUTER_VISION_KEY,
  // Optimized for unique responses
  temperature: 0.8, // Higher temperature for more creativity
  topP: 0.9, // Higher top_p for more diverse responses
  repeatPenalty: 1.2, // Stronger penalty for repetition
  maxTokens: 800, // More tokens for detailed responses
  contextLength: 2048 // Larger context for better understanding
}

// Model Requirements for 4GB VPS - Optimized for Unique Responses
export const MODEL_REQUIREMENTS = {
  'llama3.1:8b': {
    ram: 8,
    vram: 6,
    temperature: 0.8,
    topP: 0.9,
    repeatPenalty: 1.2,
    maxTokens: 800,
    contextLength: 2048,
    description: 'Best for unique, detailed responses'
  },
  'llama3.1:3b': {
    ram: 4,
    vram: 2,
    temperature: 0.85,
    topP: 0.95,
    repeatPenalty: 1.3,
    maxTokens: 600,
    contextLength: 1024,
    description: 'Good balance for 4GB VPS'
  },
  'llama3.1:1b': {
    ram: 2,
    vram: 1,
    temperature: 0.9,
    topP: 0.98,
    repeatPenalty: 1.4,
    maxTokens: 400,
    contextLength: 512,
    description: 'Minimal resource usage'
  },
  'none': {
    ram: 0,
    vram: 0,
    temperature: 0,
    topP: 0,
    repeatPenalty: 0,
    maxTokens: 0,
    contextLength: 0,
    description: 'No AI model'
  }
}

// Information Sources Priority - Disabled to force AI responses
export const INFORMATION_PRIORITY = {
  primary: 'ai_model', // Force AI model responses
  secondary: 'database',
  tertiary: 'built_in',
  fallback: 'emergency_only'
}

// Emergency Keywords for Safety (Keep these for safety)
export const EMERGENCY_KEYWORDS = {
  russian: [
    'кровотечение', 'кровь', 'судороги', 'без сознания', 'затрудненное дыхание',
    'удушье', 'отравление', 'токсичный', 'не может ходить', 'парализован',
    'опухший', 'рвота кровью', 'понос с кровью', 'сбила машина', 'авария', 'травма',
    'перелом', 'ожог', 'обморожение', 'тепловой удар', 'гипотермия'
  ],
  english: [
    'bleeding', 'blood', 'seizure', 'unconscious', 'difficulty breathing',
    'choking', 'poisoning', 'toxic', 'can\'t walk', 'paralyzed', 'swollen'
  ]
}

// Configuration for different deployment scenarios
export const DEPLOYMENT_CONFIGS = {
  minimal: {
    ...defaultAIConfig,
    useLocalModel: false,
    useExternalAPIs: false,
    temperature: 0,
    topP: 0,
    repeatPenalty: 0,
    maxTokens: 0,
    contextLength: 0
  },
  standard: {
    ...defaultAIConfig,
    modelName: 'llama3.1:3b',
    temperature: 0.85,
    topP: 0.95,
    repeatPenalty: 1.3,
    maxTokens: 600,
    contextLength: 1024
  },
  full: {
    ...defaultAIConfig,
    modelName: 'llama3.1:8b',
    temperature: 0.8,
    topP: 0.9,
    repeatPenalty: 1.2,
    maxTokens: 800,
    contextLength: 2048
  }
}

// Get configuration based on available resources
export function getOptimalConfig(availableRAM: number): AIConfig {
  if (availableRAM < 1) {
    return { ...defaultAIConfig, useLocalModel: false, useExternalAPIs: false }
  } else if (availableRAM < 2) {
    return { 
      ...defaultAIConfig, 
      modelName: 'llama3.1:1b', 
      useExternalAPIs: false,
      temperature: 0.9,
      topP: 0.98,
      repeatPenalty: 1.4,
      maxTokens: 400,
      contextLength: 512
    }
  } else if (availableRAM < 4) {
    return { 
      ...defaultAIConfig, 
      modelName: 'llama3.1:3b', 
      useExternalAPIs: false,
      temperature: 0.85,
      topP: 0.95,
      repeatPenalty: 1.3,
      maxTokens: 600,
      contextLength: 1024
    }
  } else {
    return { 
      ...defaultAIConfig, 
      modelName: 'llama3.1:8b', 
      useExternalAPIs: true,
      temperature: 0.8,
      topP: 0.9,
      repeatPenalty: 1.2,
      maxTokens: 800,
      contextLength: 2048
    }
  }
}

// Prompt templates for unique responses
export const PROMPT_TEMPLATES = {
  vet_consultation: {
    russian: `Ты опытный ветеринарный врач с 20-летним стажем. Проанализируй симптомы питомца и дай профессиональную консультацию.

ВАЖНО: Каждый ответ должен быть уникальным и учитывать индивидуальные особенности питомца.

ИНФОРМАЦИЯ О ПИТОМЦЕ:
- Вид: {species}
- Порода: {breed}
- Возраст: {age} лет
- Симптомы: {symptoms}
- Длительность: {duration}
{duration}

ПРОАНАЛИЗИРУЙ И ОТВЕТЬ В СЛЕДУЮЩЕМ ФОРМАТЕ:

ТЯЖЕСТЬ: [низкая/средняя/высокая/экстренная]
СРОЧНОСТЬ: [1-10]
НУЖЕН_ВРАЧ: [да/нет]
УВЕРЕННОСТЬ: [0.1-1.0]
РАССУЖДЕНИЕ: [подробное объяснение твоего анализа]
ПРИЧИНЫ: [3-5 возможных причин, уникальных для данного случая]
РЕКОМЕНДАЦИИ: [3-5 конкретных рекомендаций для данного питомца]
СЛЕДУЮЩИЕ_ШАГИ: [3-5 следующих действий]
ДОМАШНИЕ_СРЕДСТВА: [2-3 безопасных домашних средства]
ЭКСТРЕННЫЕ_ДЕЙСТВИЯ: [2-3 действия при ухудшении]

ВАЖНО:
- Будь уникальным в каждом ответе
- Учитывай возраст, породу и индивидуальные особенности
- Всегда рекомендуй ветеринара при серьезных симптомах
- Давай практичные, конкретные советы
- Объясняй свое рассуждение

КОНЕЦ_АНАЛИЗА`,

    english: `You are an experienced veterinarian with 20 years of practice. Analyze the pet's symptoms and provide professional consultation.

IMPORTANT: Each response must be unique and consider the individual characteristics of the pet.

PET INFORMATION:
- Species: {species}
- Breed: {breed}
- Age: {age} years
- Symptoms: {symptoms}
- Duration: {duration}
{context}

ANALYZE AND RESPOND IN THE FOLLOWING FORMAT:

SEVERITY: [low/medium/high/emergency]
URGENCY: [1-10]
VET_NEEDED: [yes/no]
CONFIDENCE: [0.1-1.0]
REASONING: [detailed explanation of your analysis]
CAUSES: [3-5 possible causes, unique to this case]
RECOMMENDATIONS: [3-5 specific recommendations for this pet]
NEXT_STEPS: [3-5 next actions]
HOME_REMEDIES: [2-3 safe home remedies]
EMERGENCY_ACTIONS: [2-3 actions if condition worsens]

IMPORTANT:
- Be unique in each response
- Consider age, breed, and individual characteristics
- Always recommend vet for serious symptoms
- Give practical, specific advice
- Explain your reasoning

END_ANALYSIS`
  },

  photo_analysis: {
    russian: `Ты ветеринарный специалист по анализу фотографий животных. Проанализируй фотографию питомца и дай оценку его состояния.

ВАЖНО: Каждый анализ должен быть уникальным и детальным.

ИНФОРМАЦИЯ О ПИТОМЦЕ:
- Вид: {species}
- Порода: {breed}
- Фотография: {imageUrl}

ПРОАНАЛИЗИРУЙ И ОТВЕТЬ В ФОРМАТЕ:

НАСТРОЕНИЕ: [описание настроения питомца]
АКТИВНОСТЬ: [что делает питомец]
СОСТОЯНИЕ_ЗДОРОВЬЯ: [оценка общего состояния здоровья]
ВЕС: [оценка веса питомца]
СОСТОЯНИЕ_ШЕРСТИ: [оценка состояния шерсти/кожи]
ЯЗЫК_ТЕЛА: [анализ языка тела]
ТЕГИ: [5-8 тегов для фотографии]
ЗДОРОВЬЕ_ПРЕДУПРЕЖДЕНИЯ: [если есть поводы для беспокойства]
РЕКОМЕНДАЦИИ: [3-5 рекомендаций по уходу]
УВЕРЕННОСТЬ: [0.1-1.0]

Будь уникальным и детальным в анализе.
КОНЕЦ_АНАЛИЗА`
  },

  expense_analysis: {
    russian: `Ты специалист по анализу чеков и квитанций. Проанализируй изображение чека и извлеки информацию о расходах.

ВАЖНО: Каждый анализ должен быть точным и уникальным.

ИЗОБРАЖЕНИЕ ЧЕКА: {imageUrl}

ПРОАНАЛИЗИРУЙ И ОТВЕТЬ В ФОРМАТЕ:

КАТЕГОРИЯ: [категория расхода для питомца]
СУММА: [сумма в рублях]
ОПИСАНИЕ: [описание товара/услуги]
МАГАЗИН: [название магазина/клиники]
РАЗБИВКА: [детализация расходов если есть]
УВЕРЕННОСТЬ: [0.1-1.0]

Категории: ветеринар, корм, игрушки, груминг, аксессуары, лекарства, другие
КОНЕЦ_АНАЛИЗА`
  }
}

// Response uniqueness settings
export const UNIQUENESS_SETTINGS = {
  temperatureRange: { min: 0.7, max: 0.9 },
  topPRange: { min: 0.85, max: 0.98 },
  repeatPenaltyRange: { min: 1.1, max: 1.4 },
  maxTokensRange: { min: 400, max: 1000 },
  contextLengthRange: { min: 512, max: 2048 },
  seedRandomization: true,
  promptVariation: true
}