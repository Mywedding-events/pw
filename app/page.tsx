export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] p-8 text-center wedding-panel sm:p-12">
        <p className="wedding-kicker">
          Guest List Atelier
        </p>
        <p className="font-script mt-5 text-6xl leading-none text-[#c97883] sm:text-7xl">
          Joe & Elissa
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#3b2027] sm:text-5xl">
          A wedding celebration starts with the right invitation list.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#7c5f65] sm:text-base">
          Open a wedding dashboard at{" "}
          <span className="rounded-full bg-[#fffdf8] px-3 py-1 font-mono text-[#6f2537]">
            /&lt;wedding-id&gt;
          </span>{" "}
          to manage invitation groups, RSVP status, and guest details.
        </p>
      </section>
    </main>
  );
}
