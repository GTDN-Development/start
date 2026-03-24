import { ApplicationLayout } from "@/features/application/application-layout";
import { ApplicationSidebar } from "@/features/application/application-sidebar";

type ApplicationShellLayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: ApplicationShellLayoutProps) {
  return <ApplicationLayout sidebar={<ApplicationSidebar />}>{children}</ApplicationLayout>;
}
