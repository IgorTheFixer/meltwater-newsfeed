import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "In the News",
  description: "Recent media coverage and mentions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
