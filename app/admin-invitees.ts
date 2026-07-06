"use server";

import { revalidatePath } from "next/cache";

const API_BASE_URL = "https://api.mywedding.events";
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
  weddingId: string,
  invitees: InviteeDraft[]
): Promise<CreateInviteesResult> {
  const trimmedWeddingId = weddingId.trim();
  const cleanedInvitees = invitees
    .map(cleanInvitee)
    .filter((invitee) => invitee.invitationCode && invitee.fullName);

  if (!trimmedWeddingId) {
    return {
      ok: false,
      error: "Open this page with a wedding ID in the URL."
    };
  }

  if (cleanedInvitees.length === 0) {
    return {
      ok: false,
      error: "Add at least one invitee with a name and invitation code."
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/admin/weddings/${encodeURIComponent(trimmedWeddingId)}/invitees`,
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

  revalidatePath(`/${trimmedWeddingId}`);

  return { ok: true };
}
