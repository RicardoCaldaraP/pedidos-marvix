import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Marvix — Pedidos",
  description: "Sistema de gerenciamento de pedidos Marvix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a",
              border: "1px solid rgb(255 255 255 / 0.1)",
              color: "white",
            },
          }}
        />
      </body>
    </html>
  );
}
