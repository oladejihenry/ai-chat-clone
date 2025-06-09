import type { Metadata } from "next";
import { Inter } from "next/font/google"
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarComponent } from "@/components/sidebar";
import { Footer } from "@/components/footer";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConversationProvider } from "@/components/providers/conversation-provider";
import { Toaster } from "sonner";
import Mobile from "@/components/mobile";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zephfi Chat",
  description: "Amazing AI Chat with Multi-AI Models Support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={inter.className}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
              <ConversationProvider>
                <SidebarProvider>
                  <div className="flex h-screen w-full bg-green-50/80 dark:bg-slate-950">
                    <SidebarComponent />
                    <SidebarInset className="flex-1 flex flex-col min-h-0">
                      <Mobile />
                      <div className="flex-1 overflow-hidden">
                        {children}
                      </div>
                      <Footer />
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </ConversationProvider>
          </ThemeProvider>
          <Toaster 
            position="bottom-right"
            expand={false}
            richColors
            closeButton
          />
        </QueryProvider>
      </body>
    </html>
  );
}