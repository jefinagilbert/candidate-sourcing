import type { Metadata } from 'next';
import { Providers } from '../components/common/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flexiple AI HR | The Sourcing Refinement Loop',
  description:
    'Full-stack AI Recruiter Sourcing Refinement Loop: Decompose free-text search into objective filters & subjective rubrics, score talent pool, and iteratively refine with conversational feedback.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
