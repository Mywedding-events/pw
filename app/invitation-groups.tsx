"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createInvitees, type InviteeDraft } from "./admin-invitees";
import { CopyLinkButton } from "./copy-link-button";

const INVITATION_BASE_URL = "https://joeelissa.mywedding.events";

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
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-amber-100 text-amber-800";
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

export function InvitationGroups({ groups }: InvitationGroupsProps) {
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
      const result = await createInvitees(invitees);

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

    await submitInvitees(invitees, "Group created.", () => {
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

    await submitInvitees(invitees, "Invitee added to group.", () => {
      setOpenGroupCode(null);
      setSingleInvitee(createEmptyPerson());
    });
  }

  return (
    <div className="px-6 py-8 sm:px-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#3a2519]">
            Invitation Groups
          </h2>
          <p className="mt-1 text-sm text-[#7d6657]">
            Search by invitee name to show every member of their invitation group.
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
                placeholder="Search by name..."
                className="w-full rounded-full border border-[#d7bea3] bg-white px-5 py-3 text-sm text-[#3a2519] shadow-sm shadow-[#8f6235]/5 outline-none placeholder:text-[#a78f7d] focus:border-[#b78b5e] focus:ring-4 focus:ring-[#b78b5e]/15"
              />
            </label>
          )}

          <button
            type="button"
            onClick={() => {
              setIsCreatingGroup((isOpen) => !isOpen);
              setMessage(null);
            }}
            className="rounded-full border border-[#b78b5e]/40 bg-[#3a2519] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#5a3927] focus:outline-none focus:ring-2 focus:ring-[#b78b5e] focus:ring-offset-2"
          >
            {isCreatingGroup ? "Close" : "+ New Group"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-5 rounded-2xl border px-5 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {isCreatingGroup && (
        <form
          onSubmit={handleNewGroupSubmit}
          className="mb-6 rounded-3xl border border-[#ead9c7] bg-[#fff8f0] p-5 shadow-sm shadow-[#8f6235]/5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <label className="w-full lg:max-w-sm">
              <span className="text-sm font-semibold text-[#3a2519]">
                Invitation code
              </span>
              <input
                type="text"
                value={newGroupCode}
                onChange={(event) => setNewGroupCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#d7bea3] bg-white px-4 py-3 text-sm text-[#3a2519] outline-none placeholder:text-[#a78f7d] focus:border-[#b78b5e] focus:ring-4 focus:ring-[#b78b5e]/15"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setNewGroupPeople((people) => [...people, createEmptyPerson()])
              }
              className="rounded-full border border-[#b78b5e]/40 bg-white px-4 py-2 text-sm font-semibold text-[#3a2519] hover:-translate-y-0.5 hover:bg-[#fff2e5] focus:outline-none focus:ring-2 focus:ring-[#b78b5e] focus:ring-offset-2"
            >
              + Add Person
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {newGroupPeople.map((person, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl border border-[#ead9c7] bg-white p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
              >
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b78b5e]">
                    Full name
                  </span>
                  <input
                    type="text"
                    value={person.fullName}
                    onChange={(event) =>
                      updateNewGroupPerson(index, "fullName", event.target.value)
                    }
                    placeholder="Full name"
                    className="mt-2 w-full rounded-2xl border border-[#d7bea3] px-4 py-3 text-sm text-[#3a2519] outline-none placeholder:text-[#a78f7d] focus:border-[#b78b5e] focus:ring-4 focus:ring-[#b78b5e]/15"
                  />
                </label>
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b78b5e]">
                    Phone
                  </span>
                  <input
                    type="tel"
                    value={person.phone}
                    onChange={(event) =>
                      updateNewGroupPerson(index, "phone", event.target.value)
                    }
                    placeholder="Phone"
                    className="mt-2 w-full rounded-2xl border border-[#d7bea3] px-4 py-3 text-sm text-[#3a2519] outline-none placeholder:text-[#a78f7d] focus:border-[#b78b5e] focus:ring-4 focus:ring-[#b78b5e]/15"
                  />
                </label>
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b78b5e]">
                    Email
                  </span>
                  <input
                    type="email"
                    value={person.email}
                    onChange={(event) =>
                      updateNewGroupPerson(index, "email", event.target.value)
                    }
                    placeholder="Email"
                    className="mt-2 w-full rounded-2xl border border-[#d7bea3] px-4 py-3 text-sm text-[#3a2519] outline-none placeholder:text-[#a78f7d] focus:border-[#b78b5e] focus:ring-4 focus:ring-[#b78b5e]/15"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeNewGroupPerson(index)}
                  className="self-end rounded-full border border-[#d7bea3] px-4 py-3 text-sm font-semibold text-[#7d6657] hover:bg-[#fff8f0] focus:outline-none focus:ring-2 focus:ring-[#b78b5e] focus:ring-offset-2"
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
              className="rounded-full border border-[#d7bea3] px-5 py-3 text-sm font-semibold text-[#7d6657] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#b78b5e] focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full border border-[#b78b5e]/40 bg-[#3a2519] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#5a3927] focus:outline-none focus:ring-2 focus:ring-[#b78b5e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d7bea3] bg-[#fff8f0] p-10 text-center text-[#7d6657]">
          No invitees were found for this wedding.
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d7bea3] bg-[#fff8f0] p-10 text-center text-[#7d6657]">
          No groups include an invitee named &quot;{searchQuery.trim()}&quot;.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredGroups.map(({ group, groupNumber }) => {
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
                  <div className="flex flex-wrap gap-2">
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
                      className="rounded-full border border-[#b78b5e]/40 bg-white px-4 py-2 text-sm font-semibold text-[#3a2519] shadow-sm hover:-translate-y-0.5 hover:bg-[#fff8f0] focus:outline-none focus:ring-2 focus:ring-[#b78b5e] focus:ring-offset-2"
                    >
                      {openGroupCode === group.invitationCode ? "Close" : "+ Person"}
                    </button>
                  </div>
                </div>

                {openGroupCode === group.invitationCode && (
                  <form
                    onSubmit={(event) =>
                      handleSingleInviteeSubmit(event, group.invitationCode)
                    }
                    className="mt-5 grid gap-3 rounded-2xl border border-[#ead9c7] bg-[#fff8f0] p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
                  >
                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b78b5e]">
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
                        className="mt-2 w-full rounded-2xl border border-[#d7bea3] bg-white px-4 py-3 text-sm text-[#3a2519] outline-none placeholder:text-[#a78f7d] focus:border-[#b78b5e] focus:ring-4 focus:ring-[#b78b5e]/15"
                      />
                    </label>
                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b78b5e]">
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
                        className="mt-2 w-full rounded-2xl border border-[#d7bea3] bg-white px-4 py-3 text-sm text-[#3a2519] outline-none placeholder:text-[#a78f7d] focus:border-[#b78b5e] focus:ring-4 focus:ring-[#b78b5e]/15"
                      />
                    </label>
                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b78b5e]">
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
                        className="mt-2 w-full rounded-2xl border border-[#d7bea3] bg-white px-4 py-3 text-sm text-[#3a2519] outline-none placeholder:text-[#a78f7d] focus:border-[#b78b5e] focus:ring-4 focus:ring-[#b78b5e]/15"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="self-end rounded-full border border-[#b78b5e]/40 bg-[#3a2519] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#5a3927] focus:outline-none focus:ring-2 focus:ring-[#b78b5e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Adding..." : "Add"}
                    </button>
                  </form>
                )}

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
