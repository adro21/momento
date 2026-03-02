import type { Metadata } from "next";
import { displayFont, monoFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momento",
  description: "Cinematic git history timelapse for your web projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
