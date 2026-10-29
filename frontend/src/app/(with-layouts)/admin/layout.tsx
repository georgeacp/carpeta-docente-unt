import { ReactNode } from "react";
import { RoleGate } from "@/components/common/role-gate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={["admin"]}>{children}</RoleGate>;
}
