// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';


export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating task' }, { status: 500 });
  }
}

