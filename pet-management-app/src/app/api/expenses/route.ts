import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        pet: {
          select: {
            name: true,
            species: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedExpenses = expenses.map(expense => ({
      id: expense.id,
      title: expense.title,
      amount: parseFloat(expense.amount.toString()),
      category: expense.category,
      date: expense.date.toISOString(),
      description: expense.description,
      petId: expense.petId,
      pet: expense.pet
    }))

    return NextResponse.json(transformedExpenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Debug: Log session information
    console.log('=== EXPENSE CREATION DEBUG ===')
    console.log('Session user ID:', session.user.id)
    console.log('Session user email:', session.user.email)

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      console.error('❌ User not found in database:', session.user.id)
      return NextResponse.json({ 
        error: 'User not found in database' 
      }, { status: 401 })
    }

    console.log('✅ User found in database:', user.id, user.email)

    const body = await request.json()
    const { title, amount, category, date, description, petId } = body

    // Validate required fields
    if (!title || !amount || !category || !date) {
      return NextResponse.json({ 
        error: 'Title, amount, category, and date are required' 
      }, { status: 400 })
    }

    // Validate amount is a valid number
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount < 0) {
      return NextResponse.json({ 
        error: 'Amount must be a valid positive number' 
      }, { status: 400 })
    }

    // If petId is provided, verify the pet belongs to the user
    if (petId) {
      const pet = await prisma.pet.findFirst({
        where: {
          id: petId.toString(),
          userId: session.user.id
        }
      })

      if (!pet) {
        return NextResponse.json({ error: 'Pet not found or access denied' }, { status: 404 })
      }
    }

    console.log('💰 Creating expense with data:', {
      title: title.toString(),
      amount: numericAmount,
      category: category.toString(),
      date: new Date(date),
      description: description?.toString() || null,
      petId: petId?.toString() || null,
      userId: session.user.id
    })

    const expense = await prisma.expense.create({
      data: {
        title: title.toString(),
        amount: numericAmount,
        category: category.toString(),
        date: new Date(date),
        description: description?.toString() || null,
        petId: petId?.toString() || null,
        userId: session.user.id
      },
      include: {
        pet: petId ? {
          select: {
            name: true,
            species: true
          }
        } : undefined
      }
    })

    console.log('✅ Expense created successfully:', expense.id)

    // Transform the response
    const transformedExpense = {
      id: expense.id,
      title: expense.title,
      amount: parseFloat(expense.amount.toString()),
      category: expense.category,
      date: expense.date.toISOString(),
      description: expense.description,
      petId: expense.petId,
      pet: expense.pet
    }

    return NextResponse.json(transformedExpense, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating expense:', error)
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json({ 
      error: 'Failed to create expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}