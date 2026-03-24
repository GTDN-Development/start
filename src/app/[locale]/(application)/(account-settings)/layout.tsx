import { ApplicationLayout } from "@/features/application/application-layout";

type AccountSettingsLayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: AccountSettingsLayoutProps) {
  return <ApplicationLayout>{children}</ApplicationLayout>;
}
