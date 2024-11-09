// src/app/actions.ts
'use server'

import { prisma } from '@/lib/prisma';
import { Status, Priority } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getTasks() {
  return await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function addTask(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as Priority;
  const dueDateStr = formData.get('dueDate') as string;
  
  await prisma.task.create({
    data: {
      title,
      description,
      priority,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
    },
  });
  
  revalidatePath('/');
}

export async function updateTaskStatus(id: string, status: Status) {
  await prisma.task.update({
    where: { id },
    data: { status },
  });
  
  revalidatePath('/');
}

export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id },
  });
  
  revalidatePath('/');
}