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
      className="rounded-full px-4 py-2 text-sm font-semibold wedding-button-primary focus:outline-none focus:ring-2 focus:ring-[#c97883] focus:ring-offset-2"
    >
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}
