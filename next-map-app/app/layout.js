import './globals.css';

export const metadata = {
  title: 'CodeVyuh World Map',
  description: 'A procedural map-based application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
