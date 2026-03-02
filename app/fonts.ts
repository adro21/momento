import { Outfit, JetBrains_Mono } from "next/font/google";

export const displayFont = Outfit({
  subsets: ["latin"],
  variable: "--font-display-family",
  weight: ["400", "500", "600", "700"],
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-family",
  weight: ["400", "500"],
});
