import type { Metadata } from "next"
import { AuthProvider } from "@/components/auth/AuthProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "TypeRush - Competitive Typing Racing",
  description: "Race against friends in real-time typing battles. Improve your WPM and climb the leaderboards!",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
