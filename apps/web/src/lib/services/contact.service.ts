import { cache } from "react";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateContactMessageData {
  name: string;
  email: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of contact messages, newest first.
 */
export async function getContactMessages(page = 1, pageSize = 50) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await db.$transaction([
    db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    }),
    db.contactMessage.count(),
  ]);

  return { items, total };
}

/**
 * Count unread contact messages.
 */
export const getUnreadMessageCount = cache(async () => {
  return db.contactMessage.count({
    where: { isRead: false },
  });
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new contact message.
 */
export async function createContactMessage(data: CreateContactMessageData) {
  return db.contactMessage.create({ data });
}

/**
 * Mark a contact message as read.
 */
export async function markMessageAsRead(id: number) {
  return db.contactMessage.update({
    where: { id },
    data: { isRead: true },
  });
}
