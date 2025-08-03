// AI Configuration System
export interface AIConfig {
  // Model Configuration
  useLocalModel: boolean
  modelEndpoint: string
  modelName: string
  
  // Knowledge Sources
  useBuiltInKnowledge: boolean
  useExternalAPIs: boolean
  useDatabaseKnowledge: boolean
  
  // Feature Toggles
  enablePhotoAnalysis: boolean
  enableExpenseAnalysis: boolean
  enableVetConsultations: boolean
  
  // External API Keys (optional)
  openaiApiKey?: string
  googleVisionApiKey?: string
  azureComputerVisionKey?: string
}

// Default configuration for 4GB VPS
export const defaultAIConfig: AIConfig = {
  // Model settings
  useLocalModel: process.env.AI_USE_LOCAL === 'true',
  modelEndpoint: process.env.AI_MODEL_ENDPOINT || 'http://localhost:11434',
  modelName: process.env.AI_MODEL_NAME || 'llama3.1:8b',
  
  // Knowledge sources
  useBuiltInKnowledge: true, // Always enabled as fallback
  useExternalAPIs: process.env.AI_USE_EXTERNAL_APIS === 'true',
  useDatabaseKnowledge: true,
  
  // Features
  enablePhotoAnalysis: true,
  enableExpenseAnalysis: true,
  enableVetConsultations: true,
  
  // External APIs (optional)
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
  azureComputerVisionKey: process.env.AZURE_COMPUTER_VISION_KEY
}

// Knowledge Base Sources
export const KNOWLEDGE_SOURCES = {
  // Built-in Russian veterinary knowledge
  builtIn: {
    symptoms: true,
    breeds: true,
    foods: true,
    medications: true,
    emergencyKeywords: true
  },
  
  // Database knowledge (can be updated by users)
  database: {
    userConsultations: true,
    petHealthRecords: true,
    customSymptoms: true,
    localVetContacts: true
  },
  
  // External APIs (optional)
  external: {
    veterinaryDatabases: false,
    imageAnalysis: false,
    ocrServices: false,
    realTimeUpdates: false
  }
}

// Model Requirements for 4GB VPS
export const MODEL_REQUIREMENTS = {
  'llama3.1:8b': {
    ram: '2.5GB',
    vram: '2GB',
    cpu: '4 cores',
    disk: '4GB',
    performance: 'medium'
  },
  'llama3.1:3b': {
    ram: '1.5GB',
    vram: '1GB',
    cpu: '2 cores',
    disk: '2GB',
    performance: 'fast'
  },
  'llama3.1:1b': {
    ram: '800MB',
    vram: '512MB',
    cpu: '1 core',
    disk: '1GB',
    performance: 'very fast'
  },
  'none': {
    ram: '50MB',
    vram: '0MB',
    cpu: '1 core',
    disk: '10MB',
    performance: 'instant'
  }
}

// Information Sources Priority
export const INFORMATION_PRIORITY = {
  1: 'builtIn', // Always available, Russian veterinary knowledge
  2: 'database', // User data, consultations history
  3: 'localModel', // Ollama if available
  4: 'externalAPIs' // External services if configured
}

// Russian Veterinary Knowledge Base (Expandable)
export const RUSSIAN_VET_KNOWLEDGE = {
  symptoms: {
    // Common symptoms with Russian names
    'рвота': {
      severity: 'medium',
      causes: ['отравление', 'гастрит', 'инфекция', 'стресс'],
      remedies: ['голодная диета 12 часов', 'маленькие порции воды', 'наблюдение'],
      emergency: false,
      urgency: 7
    },
    'понос': {
      severity: 'medium',
      causes: ['инфекция', 'неправильное питание', 'паразиты', 'аллергия'],
      remedies: ['легкая диета', 'регидрон', 'наблюдение за состоянием'],
      emergency: false,
      urgency: 6
    },
    'хромота': {
      severity: 'medium',
      causes: ['травма', 'артрит', 'растяжение', 'инородное тело'],
      remedies: ['покой', 'холодный компресс', 'ограничение активности'],
      emergency: false,
      urgency: 6
    },
    'кашель': {
      severity: 'medium',
      causes: ['респираторная инфекция', 'аллергия', 'сердечные проблемы'],
      remedies: ['увлажнение воздуха', 'наблюдение', 'консультация ветеринара'],
      emergency: false,
      urgency: 5
    },
    'кровотечение': {
      severity: 'emergency',
      causes: ['травма', 'отравление', 'заболевание'],
      remedies: ['НЕМЕДЛЕННО К ВЕТЕРИНАРУ', 'остановка кровотечения'],
      emergency: true,
      urgency: 10
    },
    'судороги': {
      severity: 'emergency',
      causes: ['эпилепсия', 'отравление', 'травма головы'],
      remedies: ['НЕМЕДЛЕННО К ВЕТЕРИНАРУ', 'защита от травм'],
      emergency: true,
      urgency: 10
    },
    'затрудненное дыхание': {
      severity: 'emergency',
      causes: ['сердечная недостаточность', 'отек легких', 'инородное тело'],
      remedies: ['НЕМЕДЛЕННО К ВЕТЕРИНАРУ', 'покой'],
      emergency: true,
      urgency: 10
    },
    'потеря аппетита': {
      severity: 'medium',
      causes: ['стресс', 'болезнь', 'смена корма', 'зубные проблемы'],
      remedies: ['наблюдение', 'попробуйте любимую еду', 'консультация ветеринара'],
      emergency: false,
      urgency: 5
    },
    'зуд': {
      severity: 'low',
      causes: ['аллергия', 'блохи', 'кожные заболевания', 'стресс'],
      remedies: ['проверка на блох', 'антигистаминные', 'консультация ветеринара'],
      emergency: false,
      urgency: 4
    },
    'выпадение шерсти': {
      severity: 'medium',
      causes: ['аллергия', 'гормональные проблемы', 'стресс', 'паразиты'],
      remedies: ['витамины', 'правильное питание', 'консультация ветеринара'],
      emergency: false,
      urgency: 5
    }
  },
  
  breeds: {
    'собака': {
      'лабрадор': { 
        healthIssues: ['дисплазия тазобедренного сустава', 'ожирение', 'проблемы с глазами'], 
        lifespan: '10-12 лет',
        care: ['регулярные упражнения', 'контроль веса', 'ежегодные осмотры']
      },
      'немецкая овчарка': { 
        healthIssues: ['дисплазия', 'проблемы с позвоночником', 'проблемы с желудком'], 
        lifespan: '9-13 лет',
        care: ['правильное питание', 'умеренные нагрузки', 'регулярные осмотры']
      },
      'йоркширский терьер': { 
        healthIssues: ['проблемы с зубами', 'гипогликемия', 'проблемы с глазами'], 
        lifespan: '12-15 лет',
        care: ['регулярная чистка зубов', 'частое кормление', 'защита от холода']
      },
      'хаски': { 
        healthIssues: ['проблемы с глазами', 'дисплазия', 'эпилепсия'], 
        lifespan: '12-15 лет',
        care: ['активные прогулки', 'прохладная среда', 'регулярные осмотры']
      },
      'чихуахуа': {
        healthIssues: ['проблемы с сердцем', 'гипогликемия', 'проблемы с зубами'],
        lifespan: '12-20 лет',
        care: ['тепло', 'частое кормление', 'защита от травм']
      }
    },
    'кошка': {
      'персидская': { 
        healthIssues: ['проблемы с дыханием', 'поликистоз почек', 'проблемы с глазами'], 
        lifespan: '12-16 лет',
        care: ['регулярное расчесывание', 'чистка глаз', 'контроль веса']
      },
      'сиамская': { 
        healthIssues: ['проблемы с сердцем', 'почечная недостаточность', 'проблемы с зубами'], 
        lifespan: '15-20 лет',
        care: ['регулярные осмотры', 'контроль веса', 'правильное питание']
      },
      'британская короткошерстная': { 
        healthIssues: ['ожирение', 'проблемы с сердцем', 'проблемы с суставами'], 
        lifespan: '12-20 лет',
        care: ['контроль веса', 'активные игры', 'сбалансированное питание']
      },
      'мейн-кун': { 
        healthIssues: ['гипертрофическая кардиомиопатия', 'дисплазия', 'проблемы с почками'], 
        lifespan: '12-15 лет',
        care: ['регулярные осмотры', 'контроль веса', 'активные игры']
      },
      'сфинкс': {
        healthIssues: ['проблемы с кожей', 'проблемы с сердцем', 'проблемы с зубами'],
        lifespan: '8-14 лет',
        care: ['защита от солнца', 'регулярное купание', 'тепло']
      }
    }
  },
  
  foods: {
    'собака': {
      safe: ['курица', 'говядина', 'рис', 'морковь', 'яблоки', 'бананы', 'тыква', 'сладкий картофель'],
      dangerous: ['шоколад', 'виноград', 'лук', 'чеснок', 'авокадо', 'орехи', 'алкоголь', 'кофеин'],
      allergies: ['курица', 'говядина', 'молочные продукты', 'зерновые', 'яйца', 'соя'],
      recommended: ['качественный сухой корм', 'свежее мясо', 'овощи', 'фрукты']
    },
    'кошка': {
      safe: ['курица', 'рыба', 'печень', 'морковь', 'тыква', 'яйца'],
      dangerous: ['шоколад', 'лук', 'чеснок', 'авокадо', 'алкоголь', 'кофеин'],
      allergies: ['рыба', 'молочные продукты', 'курица', 'зерновые'],
      recommended: ['качественный влажный корм', 'свежее мясо', 'вода']
    }
  },
  
  medications: {
    'антибиотики': { 
      description: 'Для лечения бактериальных инфекций', 
      duration: '7-14 дней',
      sideEffects: ['расстройство желудка', 'аллергия'],
      instructions: 'Давать строго по назначению ветеринара'
    },
    'противоглистные': { 
      description: 'Для лечения паразитов', 
      duration: '1-3 дня',
      sideEffects: ['тошнота', 'диарея'],
      instructions: 'Повторять каждые 3-6 месяцев'
    },
    'витамины': { 
      description: 'Поддержка иммунитета', 
      duration: 'постоянно',
      sideEffects: ['редко'],
      instructions: 'Давать по инструкции'
    },
    'обезболивающие': { 
      description: 'Для снятия боли', 
      duration: 'по назначению',
      sideEffects: ['сонливость', 'расстройство желудка'],
      instructions: 'Только по назначению ветеринара'
    },
    'противовоспалительные': {
      description: 'Для снятия воспаления',
      duration: 'по назначению',
      sideEffects: ['проблемы с желудком', 'проблемы с почками'],
      instructions: 'Строго по назначению ветеринара'
    }
  },
  
  emergencyKeywords: [
    'кровотечение', 'кровь', 'судороги', 'без сознания', 'затрудненное дыхание',
    'удушье', 'отравление', 'токсичный', 'не может ходить', 'парализован',
    'опухший', 'рвота кровью', 'понос с кровью', 'сбила машина', 'авария', 'травма',
    'перелом', 'ожог', 'обморожение', 'тепловой удар', 'гипотермия'
  ]
}

// Configuration for different deployment scenarios
export const DEPLOYMENT_CONFIGS = {
  // Minimal setup - no Ollama, only knowledge base
  minimal: {
    useLocalModel: false,
    useBuiltInKnowledge: true,
    useExternalAPIs: false,
    ramUsage: '50MB',
    features: ['vet_consultations', 'photo_analysis_basic', 'expense_analysis_basic']
  },
  
  // Standard setup - with Ollama 3B model
  standard: {
    useLocalModel: true,
    modelName: 'llama3.1:3b',
    useBuiltInKnowledge: true,
    useExternalAPIs: false,
    ramUsage: '1.5GB',
    features: ['vet_consultations', 'photo_analysis', 'expense_analysis', 'ai_chat']
  },
  
  // Full setup - with Ollama 8B model
  full: {
    useLocalModel: true,
    modelName: 'llama3.1:8b',
    useBuiltInKnowledge: true,
    useExternalAPIs: true,
    ramUsage: '2.5GB',
    features: ['vet_consultations', 'photo_analysis', 'expense_analysis', 'ai_chat', 'advanced_analysis']
  }
}

// Get configuration based on available resources
export function getOptimalConfig(availableRAM: number): AIConfig {
  if (availableRAM < 1) {
    return {
      ...defaultAIConfig,
      useLocalModel: false,
      useExternalAPIs: false
    }
  } else if (availableRAM < 2) {
    return {
      ...defaultAIConfig,
      modelName: 'llama3.1:3b',
      useExternalAPIs: false
    }
  } else {
    return {
      ...defaultAIConfig,
      modelName: 'llama3.1:8b',
      useExternalAPIs: true
    }
  }
}