import { CopyLinkButton } from "./copy-link-button";

export const dynamic = "force-dynamic";

const API_BASE_URL = "https://api.mywedding.events";
const WEDDING_ID = "80e1e815-408c-48eb-a6d1-40aa8241f8e7";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "change-me";
const INVITATION_BASE_URL = "https://joeelissa.mywedding.events";

type Invitee = {
  id: string;
  invitationCode?: string | null;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: "pending" | "accepted" | "rejected";
};

type Wedding = {
  id: string;
  groomName?: string | null;
  brideName?: string | null;
  weddingDate?: string | null;
};

type WeddingDetailResponse = {
  wedding?: Wedding;
  invitees?: Invitee[];
};

type InviteeGroup = {
  invitationCode: string;
  invitees: Invitee[];
};

type RsvpCounts = {
  accepted: number;
  rejected: number;
  pending: number;
};

async function getWeddingDetails(): Promise<WeddingDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/admin/weddings/${WEDDING_ID}`, {
    headers: {
      "X-Admin-Password": ADMIN_PASSWORD
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to load wedding details: ${response.status}`);
  }

  return response.json();
}

function groupInvitees(invitees: Invitee[]): InviteeGroup[] {
  const groups = new Map<string, Invitee[]>();

  for (const invitee of invitees) {
    const invitationCode = invitee.invitationCode?.trim() || "without-code";
    const group = groups.get(invitationCode) ?? [];
    group.push(invitee);
    groups.set(invitationCode, group);
  }

  return Array.from(groups.entries())
    .map(([invitationCode, groupedInvitees]) => ({
      invitationCode,
      invitees: groupedInvitees.sort((a, b) =>
        (a.fullName ?? "").localeCompare(b.fullName ?? "")
      )
    }))
    .sort((a, b) => a.invitationCode.localeCompare(b.invitationCode));
}

function formatWeddingDate(date?: string | null) {
  if (!date) {
    return "Wedding date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "full"
  }).format(new Date(`${date}T00:00:00`));
}

function statusClasses(status?: Invitee["status"]) {
  switch (status) {
    case "accepted":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function countRsvpStatuses(invitees: Invitee[]): RsvpCounts {
  return invitees.reduce<RsvpCounts>(
    (counts, invitee) => {
      counts[invitee.status ?? "pending"] += 1;
      return counts;
    },
    { accepted: 0, rejected: 0, pending: 0 }
  );
}

export default async function Home() {
  const { wedding, invitees = [] } = await getWeddingDetails();
  const groups = groupInvitees(invitees);
  const totalInvitees = invitees.length;
  const rsvpCounts = countRsvpStatuses(invitees);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-4xl border border-white/70 bg-white/75 shadow-2xl shadow-[#8f6235]/10 backdrop-blur">
          <div className="border-b border-[#ead9c7] bg-[#3a2519] px-6 py-8 text-white sm:px-10">
            <p className="text-sm uppercase tracking-[0.35em] text-[#e7caa6]">
              Wedding Invitees
            </p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {wedding?.groomName ?? "Joe"} & {wedding?.brideName ?? "Elissa"}
                </h1>
                <p className="mt-3 text-lg text-[#f4dfc8]">
                  {formatWeddingDate(wedding?.weddingDate)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-80 lg:grid-cols-5">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm text-[#e7caa6]">Groups</p>
                  <p className="mt-1 text-3xl font-semibold">{groups.length}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm text-[#e7caa6]">Invitees</p>
                  <p className="mt-1 text-3xl font-semibold">{totalInvitees}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm text-[#e7caa6]">Accepted</p>
                  <p className="mt-1 text-3xl font-semibold">{rsvpCounts.accepted}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm text-[#e7caa6]">Rejected</p>
                  <p className="mt-1 text-3xl font-semibold">{rsvpCounts.rejected}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm text-[#e7caa6]">Pending</p>
                  <p className="mt-1 text-3xl font-semibold">{rsvpCounts.pending}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-10">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#3a2519]">
                  Invitation Groups
                </h2>
                <p className="mt-1 text-sm text-[#7d6657]">
                  Invitees sharing the same invitation code are grouped together.
                </p>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#d7bea3] bg-[#fff8f0] p-10 text-center text-[#7d6657]">
                No invitees were found for this wedding.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {groups.map((group, index) => {
                  const groupNumber = index + 1;
                  const invitationUrl = `${INVITATION_BASE_URL}/${group.invitationCode}`;

                  return (
                    <article
                      key={group.invitationCode}
                      className="rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm shadow-[#8f6235]/5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b78b5e]">
                            Group {groupNumber}
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold text-[#3a2519]">
                            {group.invitationCode}
                          </h3>
                          <a
                            href={invitationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block break-all text-sm text-[#7d6657] hover:text-[#3a2519]"
                          >
                            {invitationUrl}
                          </a>
                        </div>
                        <CopyLinkButton url={invitationUrl} />
                      </div>

                      <div className="mt-5 divide-y divide-[#f0e4d8]">
                        {group.invitees.map((invitee) => (
                          <div
                            key={invitee.id}
                            className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-[#3a2519]">
                                {invitee.fullName || "Unnamed invitee"}
                              </p>
                              {(invitee.phone || invitee.email) && (
                                <p className="mt-1 text-sm text-[#8a7465]">
                                  {[invitee.phone, invitee.email].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                            <span
                              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                                invitee.status
                              )}`}
                            >
                              {invitee.status ?? "pending"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
