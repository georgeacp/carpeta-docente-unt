"use client";

import Link from "next/link";
import { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { useNavigationGuard } from "@/context/navigation-guard";

type GuardedLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & { href: string };

export default function GuardedLink({ href, replace, scroll, ...props }: GuardedLinkProps) {
  const router = useRouter();
  const { navigate } = useNavigationGuard();

  return <Link {...props} href={href} replace={replace} scroll={scroll} onNavigate={event => {
    if (href.startsWith("#")) return;

    event.preventDefault();
    navigate(() => replace ? router.replace(href, { scroll }) : router.push(href, { scroll }));
  }} />;
}
