import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuroraPageBackground } from "@/components/ui/aurora-background";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Aurora backdrop on every app page except the home route */}
      <AuroraPageBackground />
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
