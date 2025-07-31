import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenses = await prisma.expense.findMany({
      where: {
        pet: {
          userId: session.user.id
        }
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, amount, category, date, description, petId } = body

    // Verify the pet belongs to the user
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: session.user.id
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        petId
      },
      include: {
        pet: {
          select: {
            name: true,
            species: true
          }
        }
      }
    })

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
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}