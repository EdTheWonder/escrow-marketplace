import GradientBackground from "@/components/ui/gradient-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GradientBackground>
      <div className="container mx-auto px-4 py-4">
        {children}
      </div>
    </GradientBackground>
  );
}
