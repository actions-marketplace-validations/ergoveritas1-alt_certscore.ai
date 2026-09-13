"use client";

import { Component, type ReactNode } from "react";

export function AdminDataLoading({ label }: { label: string }) {
  return <section aria-busy="true" aria-label={`Loading ${label}`} className="rounded-xl border bg-white p-6">
    <p role="status" className="text-sm text-slate-600">Loading {label}… You can switch tabs while this loads.</p>
    <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />
  </section>;
}

export class AdminDataBoundary extends Component<{ label: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5">
      <p>{this.props.label} could not be loaded. No counts are available.</p>
      <button type="button" className="mt-3 rounded border bg-white px-3 py-2 text-sm font-semibold" onClick={() => window.location.reload()}>Retry</button>
    </section>;
    return this.props.children;
  }
}
