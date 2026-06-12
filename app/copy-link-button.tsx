"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  url: string;
};

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copyUrl}
      className="rounded-full border border-[#b78b5e]/40 bg-[#3a2519] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#5a3927] focus:outline-none focus:ring-2 focus:ring-[#b78b5e] focus:ring-offset-2"
    >
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}
