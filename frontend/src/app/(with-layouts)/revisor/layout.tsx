import { ReactNode } from "react";
import { RoleGate } from "@/components/common/role-gate";

export default function Layout({ children }: { children: ReactNode }) {
  return <RoleGate roles={["revisor"]}>{children}</RoleGate>;
}
