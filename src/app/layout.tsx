import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./AppContext";
import Navbar from "@/components/Navbar";
import DisclaimerScreen from "@/components/DisclaimerScreen";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Neon Casino Prototype",
  description: "A secure prototype casino application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex flex-col`}>
        <AppProvider>
          <DisclaimerScreen />
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
