// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const { status } = await request.json();
    const task = await prisma.task.update({
      where: { id },
      data: { status: status as Status },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: `Error updating task: ${error}` }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const task = await prisma.task.delete({
      where: { id },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: `Error deleting task: ${error}` }, 
      { status: 500 }
    );
  }
}

