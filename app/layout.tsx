import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anthem — a song that says you were seen",
  description:
    "Describe what you've lived through, and receive an original song made for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
