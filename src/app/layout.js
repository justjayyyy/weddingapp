import { Assistant } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "700", "800"],
});

export const metadata = {
  title: "💍 Wedding Planner",
  description: "Premium Wedding Management App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} antialiased`}>
      <body className="bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100 font-sans selection:bg-rose-200 selection:text-rose-900">
        {children}
      </body>
    </html>
  );
}
