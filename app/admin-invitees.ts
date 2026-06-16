"use server";

import { revalidatePath } from "next/cache";

const API_BASE_URL = "https://api.mywedding.events";
const WEDDING_ID = "80e1e815-408c-48eb-a6d1-40aa8241f8e7";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "change-me";

export type InviteeDraft = {
  invitationCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  status?: "pending" | "accepted" | "rejected";
};

type CreateInviteesResult =
  | { ok: true }
  | { ok: false; error: string };

function cleanInvitee(invitee: InviteeDraft): InviteeDraft {
  return {
    invitationCode: invitee.invitationCode.trim(),
    fullName: invitee.fullName.trim(),
    phone: invitee.phone?.trim() || undefined,
    email: invitee.email?.trim() || undefined,
    status: invitee.status ?? "pending"
  };
}

export async function createInvitees(
  invitees: InviteeDraft[]
): Promise<CreateInviteesResult> {
  const cleanedInvitees = invitees
    .map(cleanInvitee)
    .filter((invitee) => invitee.invitationCode && invitee.fullName);

  if (cleanedInvitees.length === 0) {
    return {
      ok: false,
      error: "Add at least one invitee with a name and invitation code."
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/admin/weddings/${WEDDING_ID}/invitees`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        adminPassword: ADMIN_PASSWORD,
        invitees: cleanedInvitees
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    return {
      ok: false,
      error:
        errorText ||
        `Failed to create invitees. The API returned ${response.status}.`
    };
  }

  revalidatePath("/");

  return { ok: true };
}
