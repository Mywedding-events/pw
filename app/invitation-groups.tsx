"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createInvitees, type InviteeDraft } from "./admin-invitees";
import { CopyLinkButton } from "./copy-link-button";

export type Invitee = {
  id: string;
  invitationCode?: string | null;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: "pending" | "accepted" | "rejected";
};

export type InviteeGroup = {
  invitationCode: string;
  invitees: Invitee[];
};

type InvitationGroupsProps = {
  groups: InviteeGroup[];
  weddingId: string;
  invitationBaseUrl: string;
};

type PersonFormState = {
  fullName: string;
  phone: string;
  email: string;
};

type FormMessage = {
  type: "success" | "error";
  text: string;
};

function createEmptyPerson(): PersonFormState {
  return {
    fullName: "",
    phone: "",
    email: ""
  };
}

function statusClasses(status?: Invitee["status"]) {
  switch (status) {
    case "accepted":
      return "bg-[#eef3e6] text-[#55663f]";
    case "rejected":
      return "bg-[#f7dfe2] text-[#8b3145]";
    default:
      return "bg-[#fbefd9] text-[#9a6d34]";
  }
}

function generateInvitationCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  return Array.from({ length: 8 }, () =>
    characters[Math.floor(Math.random() * characters.length)]
  ).join("");
}

function optionalValue(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

function buildInviteeDrafts(
  invitationCode: string,
  people: PersonFormState[]
): InviteeDraft[] {
  return people
    .filter((person) => person.fullName.trim())
    .map((person) => ({
      invitationCode: invitationCode.trim(),
      fullName: person.fullName.trim(),
      phone: optionalValue(person.phone),
      email: optionalValue(person.email),
      status: "pending"
    }));
}

export function InvitationGroups({
  groups,
  weddingId,
  invitationBaseUrl
}: InvitationGroupsProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState(generateInvitationCode);
  const [newGroupPeople, setNewGroupPeople] = useState<PersonFormState[]>([
    createEmptyPerson()
  ]);
  const [openGroupCode, setOpenGroupCode] = useState<string | null>(null);
  const [singleInvitee, setSingleInvitee] = useState(createEmptyPerson);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) {
      return groups.map((group, index) => ({ group, groupNumber: index + 1 }));
    }

    return groups
      .map((group, index) => ({ group, groupNumber: index + 1 }))
      .filter(({ group }) =>
        group.invitees.some((invitee) =>
          (invitee.fullName ?? "").toLowerCase().includes(normalizedQuery)
        )
      );
  }, [groups, normalizedQuery]);

  function updateNewGroupPerson(
    index: number,
    field: keyof PersonFormState,
    value: string
  ) {
    setNewGroupPeople((people) =>
      people.map((person, personIndex) =>
        personIndex === index ? { ...person, [field]: value } : person
      )
    );
  }

  function removeNewGroupPerson(index: number) {
    setNewGroupPeople((people) =>
      people.length === 1
        ? [createEmptyPerson()]
        : people.filter((_, personIndex) => personIndex !== index)
    );
  }

  async function submitInvitees(
    invitees: InviteeDraft[],
    successMessage: string,
    onSuccess: () => void
  ) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await createInvitees(weddingId, invitees);

      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      onSuccess();
      router.refresh();
      setMessage({ type: "success", text: successMessage });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while creating invitees."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNewGroupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const invitees = buildInviteeDrafts(newGroupCode, newGroupPeople);

    if (!newGroupCode.trim()) {
      setMessage({ type: "error", text: "Enter an invitation code." });
      return;
    }

    if (invitees.length === 0) {
      setMessage({
        type: "error",
        text: "Add at least one person with a full name."
      });
      return;
    }

    await submitInvitees(invitees, "Guest circle created.", () => {
      setIsCreatingGroup(false);
      setNewGroupCode(generateInvitationCode());
      setNewGroupPeople([createEmptyPerson()]);
    });
  }

  async function handleSingleInviteeSubmit(
    event: FormEvent<HTMLFormElement>,
    invitationCode: string
  ) {
    event.preventDefault();

    const invitees = buildInviteeDrafts(invitationCode, [singleInvitee]);

    if (invitees.length === 0) {
      setMessage({ type: "error", text: "Enter the invitee full name." });
      return;
    }

    await submitInvitees(invitees, "Guest added to circle.", () => {
      setOpenGroupCode(null);
      setSingleInvitee(createEmptyPerson());
    });
  }

  return (
    <div className="px-6 py-8 sm:px-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="wedding-kicker">Curated Invitations</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#3b2027]">
            Guest Circles
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7c5f65]">
            Search by guest name to reveal every loved one in their invitation circle.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl lg:justify-end">
          {groups.length > 0 && (
            <label className="w-full sm:max-w-sm">
              <span className="sr-only">Search invitees by name</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search the guest list..."
                className="w-full rounded-full px-5 py-3 text-sm wedding-field"
              />
            </label>
          )}

          <button
            type="button"
            onClick={() => {
              setIsCreatingGroup((isOpen) => !isOpen);
              setMessage(null);
            }}
            className="rounded-full px-5 py-3 text-sm font-semibold wedding-button-primary focus:outline-none focus:ring-2 focus:ring-[#c97883] focus:ring-offset-2"
          >
            {isCreatingGroup ? "Close" : "+ New Circle"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-5 rounded-2xl border px-5 py-3 text-sm ${
            message.type === "success"
              ? "border-[#dce7cf] bg-[#f5f8ef] text-[#55663f]"
              : "border-[#f1c7ce] bg-[#fff1f3] text-[#8b3145]"
          }`}
        >
          {message.text}
        </div>
      )}

      {isCreatingGroup && (
        <form
          onSubmit={handleNewGroupSubmit}
          className="mb-6 rounded-4xl p-5 wedding-card"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <label className="w-full lg:max-w-sm">
              <span className="text-sm font-semibold text-[#3b2027]">
                Invitation code
              </span>
              <input
                type="text"
                value={newGroupCode}
                onChange={(event) => setNewGroupCode(event.target.value)}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm wedding-field"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setNewGroupPeople((people) => [...people, createEmptyPerson()])
              }
              className="rounded-full px-4 py-2 text-sm font-semibold wedding-button-secondary focus:outline-none focus:ring-2 focus:ring-[#c97883] focus:ring-offset-2"
            >
              + Add Guest
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {newGroupPeople.map((person, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-3xl border border-[#f0d2d7] bg-[#fffdf8]/80 p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
              >
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b88b55]">
                    Full name
                  </span>
                  <input
                    type="text"
                    value={person.fullName}
                    onChange={(event) =>
                      updateNewGroupPerson(index, "fullName", event.target.value)
                    }
                    placeholder="Full name"
                    className="mt-2 w-full rounded-2xl px-4 py-3 text-sm wedding-field"
                  />
                </label>
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b88b55]">
                    Phone
                  </span>
                  <input
                    type="tel"
                    value={person.phone}
                    onChange={(event) =>
                      updateNewGroupPerson(index, "phone", event.target.value)
                    }
                    placeholder="Phone"
                    className="mt-2 w-full rounded-2xl px-4 py-3 text-sm wedding-field"
                  />
                </label>
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b88b55]">
                    Email
                  </span>
                  <input
                    type="email"
                    value={person.email}
                    onChange={(event) =>
                      updateNewGroupPerson(index, "email", event.target.value)
                    }
                    placeholder="Email"
                    className="mt-2 w-full rounded-2xl px-4 py-3 text-sm wedding-field"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeNewGroupPerson(index)}
                  className="self-end rounded-full px-4 py-3 text-sm font-semibold wedding-button-secondary focus:outline-none focus:ring-2 focus:ring-[#c97883] focus:ring-offset-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsCreatingGroup(false)}
              className="rounded-full px-5 py-3 text-sm font-semibold wedding-button-secondary focus:outline-none focus:ring-2 focus:ring-[#c97883] focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full px-5 py-3 text-sm font-semibold wedding-button-primary focus:outline-none focus:ring-2 focus:ring-[#c97883] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Circle"}
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d9a8b0] bg-[#fff1f3]/70 p-10 text-center text-[#7c5f65]">
          No guests were found for this wedding yet.
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d9a8b0] bg-[#fff1f3]/70 p-10 text-center text-[#7c5f65]">
          No guest circles include someone named &quot;{searchQuery.trim()}&quot;.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredGroups.map(({ group, groupNumber }) => {
            const invitationUrl = `${invitationBaseUrl}/${group.invitationCode}`;

            return (
              <article
                key={group.invitationCode}
                className="rounded-4xl p-5 wedding-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b88b55]">
                      Circle {groupNumber}
                    </p>
                    <h3 className="mt-2 text-3xl font-semibold text-[#3b2027]">
                      {group.invitationCode}
                    </h3>
                    <a
                      href={invitationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-sm text-[#7c5f65] hover:text-[#6f2537]"
                    >
                      {invitationUrl}
                    </a>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <CopyLinkButton url={invitationUrl} />
                    <button
                      type="button"
                      onClick={() => {
                        setOpenGroupCode((currentCode) =>
                          currentCode === group.invitationCode
                            ? null
                            : group.invitationCode
                        );
                        setSingleInvitee(createEmptyPerson());
                        setMessage(null);
                      }}
                      className="rounded-full px-4 py-2 text-sm font-semibold wedding-button-secondary focus:outline-none focus:ring-2 focus:ring-[#c97883] focus:ring-offset-2"
                    >
                      {openGroupCode === group.invitationCode ? "Close" : "+ Guest"}
                    </button>
                  </div>
                </div>

                {openGroupCode === group.invitationCode && (
                  <form
                    onSubmit={(event) =>
                      handleSingleInviteeSubmit(event, group.invitationCode)
                    }
                    className="mt-5 grid gap-3 rounded-3xl border border-[#f0d2d7] bg-[#fff1f3]/58 p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
                  >
                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b88b55]">
                        Full name
                      </span>
                      <input
                        type="text"
                        value={singleInvitee.fullName}
                        onChange={(event) =>
                          setSingleInvitee((invitee) => ({
                            ...invitee,
                            fullName: event.target.value
                          }))
                        }
                        placeholder="Full name"
                        className="mt-2 w-full rounded-2xl px-4 py-3 text-sm wedding-field"
                      />
                    </label>
                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b88b55]">
                        Phone
                      </span>
                      <input
                        type="tel"
                        value={singleInvitee.phone}
                        onChange={(event) =>
                          setSingleInvitee((invitee) => ({
                            ...invitee,
                            phone: event.target.value
                          }))
                        }
                        placeholder="Phone"
                        className="mt-2 w-full rounded-2xl px-4 py-3 text-sm wedding-field"
                      />
                    </label>
                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b88b55]">
                        Email
                      </span>
                      <input
                        type="email"
                        value={singleInvitee.email}
                        onChange={(event) =>
                          setSingleInvitee((invitee) => ({
                            ...invitee,
                            email: event.target.value
                          }))
                        }
                        placeholder="Email"
                        className="mt-2 w-full rounded-2xl px-4 py-3 text-sm wedding-field"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="self-end rounded-full px-4 py-3 text-sm font-semibold wedding-button-primary focus:outline-none focus:ring-2 focus:ring-[#c97883] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Adding..." : "Add"}
                    </button>
                  </form>
                )}

                <div className="mt-5 divide-y divide-[#f1d9dd]">
                  {group.invitees.map((invitee) => (
                    <div
                      key={invitee.id}
                      className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-[#3b2027]">
                          {invitee.fullName || "Unnamed guest"}
                        </p>
                        {(invitee.phone || invitee.email) && (
                          <p className="mt-1 text-sm text-[#7c5f65]">
                            {[invitee.phone, invitee.email].filter(Boolean).join(" - ")}
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
  );
}
