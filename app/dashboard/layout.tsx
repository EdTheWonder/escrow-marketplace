import GradientBackground from "@/components/ui/gradient-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GradientBackground>{children}</GradientBackground>;
}
