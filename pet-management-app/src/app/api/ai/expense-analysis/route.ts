import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"

interface ExpenseAnalysisRequest {
  title: string
  description?: string
  petSpecies?: string
}

interface ExpenseAnalysisResponse {
  category: string
  confidence: number
  suggestions: string[]
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, petSpecies }: ExpenseAnalysisRequest = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Try AI analysis first, fallback to rule-based
    const aiResult = await analyzeWithOllama(title, description, petSpecies)
    if (aiResult) {
      return NextResponse.json(aiResult)
    }

    // Fallback to rule-based analysis
    const ruleBasedResult = analyzeWithRules(title, description, petSpecies)
    return NextResponse.json(ruleBasedResult)

  } catch (error) {
    console.error('Error in expense analysis:', error)
    
    // Fallback to basic rule-based analysis
    const { title, description, petSpecies } = await request.json()
    const fallbackResult = analyzeWithRules(title, description, petSpecies)
    return NextResponse.json(fallbackResult)
  }
}

async function analyzeWithOllama(title: string, description?: string, petSpecies?: string): Promise<ExpenseAnalysisResponse | null> {
  try {
    const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b'

    const prompt = buildExpenseAnalysisPrompt(title, description, petSpecies)

    const response = await fetch(`${ollamaEndpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent categorization
          top_p: 0.9,
          num_predict: 200
        }
      })
    })

    if (!response.ok) {
      console.error('Ollama request failed:', response.status)
      return null
    }

    const data = await response.json()
    return parseOllamaResponse(data.response)

  } catch (error) {
    console.error('Error calling Ollama:', error)
    return null
  }
}

function buildExpenseAnalysisPrompt(title: string, description?: string, petSpecies?: string): string {
  const categories = [
    'vet', 'food', 'toys', 'grooming', 'medication', 
    'accessories', 'boarding', 'training', 'insurance', 'other'
  ]

  return `You are a pet expense categorization expert. Analyze this pet expense and provide categorization.

Expense Title: "${title}"
${description ? `Description: "${description}"` : ''}
${petSpecies ? `Pet Species: ${petSpecies}` : ''}

Available categories: ${categories.join(', ')}

Respond with ONLY a JSON object in this exact format:
{
  "category": "most_appropriate_category",
  "confidence": 0.95,
  "reasoning": "brief explanation",
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Rules:
- confidence should be 0.0 to 1.0
- category must be one of the available categories
- suggestions should be helpful tips or related items
- keep reasoning brief (max 50 words)

Analyze the expense now:`
}

function parseOllamaResponse(response: string): ExpenseAnalysisResponse | null {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in Ollama response')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate the response structure
    if (!parsed.category || typeof parsed.confidence !== 'number') {
      console.error('Invalid Ollama response structure')
      return null
    }

    return {
      category: parsed.category,
      confidence: Math.max(0, Math.min(1, parsed.confidence)), // Clamp between 0-1
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      reasoning: parsed.reasoning || ''
    }

  } catch (error) {
    console.error('Error parsing Ollama response:', error)
    return null
  }
}

function analyzeWithRules(title: string, description?: string, petSpecies?: string): ExpenseAnalysisResponse {
  const text = `${title} ${description || ''}`.toLowerCase()
  
  // Rule-based categorization with confidence scores
  const rules = [
    { 
      category: 'vet', 
      keywords: ['vet', 'veterinary', 'doctor', 'checkup', 'exam', 'surgery', 'treatment', 'diagnosis', 'hospital', 'clinic', 'medical'],
      confidence: 0.9 
    },
    { 
      category: 'food', 
      keywords: ['food', 'treat', 'kibble', 'meal', 'nutrition', 'diet', 'feeding', 'snack', 'wet food', 'dry food'],
      confidence: 0.85 
    },
    { 
      category: 'medication', 
      keywords: ['medication', 'medicine', 'pills', 'prescription', 'antibiotic', 'vaccine', 'vaccination', 'supplement', 'flea', 'tick', 'heartworm'],
      confidence: 0.9 
    },
    { 
      category: 'grooming', 
      keywords: ['grooming', 'bath', 'haircut', 'nail', 'trim', 'shampoo', 'brush', 'hygiene', 'cleaning'],
      confidence: 0.8 
    },
    { 
      category: 'toys', 
      keywords: ['toy', 'ball', 'rope', 'chew', 'play', 'entertainment', 'puzzle', 'squeaky'],
      confidence: 0.75 
    },
    { 
      category: 'accessories', 
      keywords: ['collar', 'leash', 'harness', 'bed', 'carrier', 'crate', 'bowl', 'clothing', 'accessory'],
      confidence: 0.8 
    },
    { 
      category: 'boarding', 
      keywords: ['boarding', 'daycare', 'sitting', 'walker', 'pet sitter', 'kennel', 'hotel'],
      confidence: 0.85 
    },
    { 
      category: 'training', 
      keywords: ['training', 'obedience', 'class', 'lesson', 'behavior', 'trainer'],
      confidence: 0.8 
    },
    { 
      category: 'insurance', 
      keywords: ['insurance', 'policy', 'premium', 'coverage', 'plan'],
      confidence: 0.95 
    }
  ]

  // Find matching rules
  let bestMatch = { category: 'other', confidence: 0.3 }
  
  for (const rule of rules) {
    const matchCount = rule.keywords.filter(keyword => text.includes(keyword)).length
    if (matchCount > 0) {
      const confidence = rule.confidence * (matchCount / rule.keywords.length)
      if (confidence > bestMatch.confidence) {
        bestMatch = { category: rule.category, confidence }
      }
    }
  }

  // Generate suggestions based on category
  const suggestions = generateSuggestions(bestMatch.category, petSpecies)

  return {
    category: bestMatch.category,
    confidence: bestMatch.confidence,
    suggestions,
    reasoning: `Matched keywords for ${bestMatch.category} category`
  }
}

function generateSuggestions(category: string, petSpecies?: string): string[] {
  const suggestions: Record<string, string[]> = {
    vet: [
      'Schedule regular checkups',
      'Keep vaccination records updated',
      'Consider pet insurance for major expenses'
    ],
    food: [
      'Buy in bulk to save money',
      'Check for subscription discounts',
      'Monitor portion sizes for health'
    ],
    medication: [
      'Set reminders for medication schedules',
      'Ask vet about generic alternatives',
      'Keep emergency medications stocked'
    ],
    grooming: [
      'Regular grooming prevents health issues',
      'Learn basic grooming at home',
      'Schedule seasonal deep cleans'
    ],
    toys: [
      'Rotate toys to maintain interest',
      'Choose durable toys for cost efficiency',
      'DIY toys can be fun and cheap'
    ],
    accessories: [
      'Invest in quality items that last',
      'Check sizing before purchasing',
      'Consider multi-functional items'
    ],
    boarding: [
      'Book early for holidays',
      'Visit facilities before booking',
      'Consider trusted friends/family'
    ],
    training: [
      'Consistency is key for results',
      'Practice at home between sessions',
      'Positive reinforcement works best'
    ],
    insurance: [
      'Compare different plans annually',
      'Understand coverage limitations',
      'Keep all medical records'
    ],
    other: [
      'Track all pet expenses for budgeting',
      'Look for seasonal sales and discounts',
      'Consider if expense is necessary'
    ]
  }

  const baseSuggestions = suggestions[category] || suggestions.other

  // Add species-specific suggestions
  if (petSpecies) {
    const speciesSpecific: Record<string, string[]> = {
      dog: ['Consider dog-specific needs', 'Factor in exercise requirements'],
      cat: ['Indoor cats have different needs', 'Consider litter box expenses'],
      bird: ['Specialized avian care is important', 'Diet variety is crucial'],
      fish: ['Water quality affects health', 'Tank maintenance is ongoing'],
      rabbit: ['Hay and vegetables are essentials', 'Spaying/neutering is important'],
      hamster: ['Small pets need frequent supplies', 'Cage cleaning is regular']
    }

    const speciesSuggestions = speciesSpecific[petSpecies.toLowerCase()]
    if (speciesSuggestions) {
      return [...baseSuggestions.slice(0, 2), ...speciesSuggestions.slice(0, 1)]
    }
  }

  return baseSuggestions.slice(0, 3)
}