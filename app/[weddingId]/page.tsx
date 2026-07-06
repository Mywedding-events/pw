import {
  InvitationGroups,
  type Invitee,
  type InviteeGroup
} from "../invitation-groups";

export const dynamic = "force-dynamic";

const API_BASE_URL = "https://api.mywedding.events";
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

type WeddingPageProps = {
  params: Promise<{
    weddingId: string;
  }>;
};

async function getWeddingDetails(weddingId: string): Promise<WeddingDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/weddings/${encodeURIComponent(weddingId)}`,
    {
      headers: {
        "X-Admin-Password": ADMIN_PASSWORD
      },
      cache: "no-store"
    }
  );

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

  return Array.from(groups.entries()).map(([invitationCode, groupedInvitees]) => ({
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

export default async function WeddingPage({ params }: WeddingPageProps) {
  const { weddingId } = await params;
  const { wedding, invitees = [] } = await getWeddingDetails(weddingId);
  const groups = groupInvitees(invitees);
  const totalInvitees = invitees.length;
  const rsvpCounts = countRsvpStatuses(invitees);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.75rem] wedding-panel">
          <div className="relative overflow-hidden border-b border-[#ead9c7]/80 bg-[linear-gradient(135deg,#3b2027_0%,#6f2537_50%,#c97883_100%)] px-6 py-9 text-white sm:px-10">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/20 bg-white/10" />
            <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full border border-[#f3dec1]/25" />
            <p className="relative text-sm font-semibold uppercase tracking-[0.35em] text-[#f3dec1]">
              Wedding Guest Suite
            </p>
            <div className="relative mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-script text-5xl leading-none text-[#f7dfe2] sm:text-6xl">
                  Together with their families
                </p>
                <h1 className="mt-2 text-5xl font-semibold tracking-tight sm:text-7xl">
                  {wedding?.groomName ?? "Wedding"} &{" "}
                  {wedding?.brideName ?? "Celebration"}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#fff5ea] sm:text-lg">
                  {formatWeddingDate(wedding?.weddingDate)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-152 xl:grid-cols-5">
                <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#f3dec1]">
                    Tables
                  </p>
                  <p className="mt-1 text-3xl font-semibold">{groups.length}</p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#f3dec1]">
                    Guests
                  </p>
                  <p className="mt-1 text-3xl font-semibold">{totalInvitees}</p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#f3dec1]">
                    Attending
                  </p>
                  <p className="mt-1 text-3xl font-semibold">
                    {rsvpCounts.accepted}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#f3dec1]">
                    Regrets
                  </p>
                  <p className="mt-1 text-3xl font-semibold">
                    {rsvpCounts.rejected}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#f3dec1]">
                    Awaiting
                  </p>
                  <p className="mt-1 text-3xl font-semibold">
                    {rsvpCounts.pending}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <InvitationGroups groups={groups} weddingId={weddingId} />
        </div>
      </section>
    </main>
  );
}
