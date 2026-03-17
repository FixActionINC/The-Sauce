import { cache } from "react";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Find an admin user by their internal ID.
 * Returns only safe fields (no passwordHash).
 */
export async function findAdminUserById(id: number) {
  return db.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
}

/**
 * Find an admin user by email.
 * Returns the full record including passwordHash (for login verification).
 */
export async function findAdminUserByEmail(email: string) {
  return db.adminUser.findUnique({
    where: { email },
  });
}

/**
 * Count total admin users.
 */
export const getAdminUserCount = cache(async () => {
  return db.adminUser.count();
});
