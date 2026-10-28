import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil institucional",
};

export default function AccountPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
