import "./globals.css";

export const metadata = {
  title: "Malcolm Bay Resorts — Development Explorer",
  description:
    "Explore the Malcolm Bay Resorts master plan — zones, lots, specs, and indicative pricing for a 983-acre coastal development in St. Elizabeth, Jamaica.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=Alex+Brush&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
