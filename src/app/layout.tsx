import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata = {
  title: "Personal Article Aggregator",
  description: "Aggregated articles from selected sources",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
