import {
  InvitationGroups,
  type Invitee,
  type InviteeGroup
} from "./invitation-groups";

export const dynamic = "force-dynamic";

const API_BASE_URL = "https://api.mywedding.events";
const WEDDING_ID = "80e1e815-408c-48eb-a6d1-40aa8241f8e7";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "change-me";

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
      invitees: groupedInvitees
    }));
}

function formatWeddingDate(date?: string | null) {
  if (!date) {
    return "Wedding date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "full"
  }).format(new Date(`${date}T00:00:00`));
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

          <InvitationGroups groups={groups} />
        </div>
      </section>
    </main>
  );
}
