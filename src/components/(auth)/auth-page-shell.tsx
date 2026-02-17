import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthPageShellProps = {
  title: string;
  description: string;
  heading: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function AuthPageShell({
  title,
  description,
  heading,
  footer,
  children,
}: AuthPageShellProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl/[1.1] font-semibold tracking-tight text-pretty sm:text-4xl/[1.1]">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm text-pretty sm:text-base">{description}</p>
      </header>

      <Card className="bg-card/90 border-border/80 py-0 shadow-lg shadow-black/5 backdrop-blur-sm">
        <CardHeader className="border-border/70 border-b py-5">
          <CardTitle className="text-xl font-semibold">{heading}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {children}
          <p className="text-muted-foreground mt-6 text-sm">{footer}</p>
        </CardContent>
      </Card>
    </section>
  );
}
