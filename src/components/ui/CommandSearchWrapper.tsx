"use client";

import dynamic from 'next/dynamic';

const CommandSearch = dynamic(
  () => import('@/components/ui/command-search').then((mod) => mod.CommandSearch),
  { ssr: false }
);

export default function CommandSearchWrapper() {
  return <CommandSearch />;
}
