import type { Metadata } from "next";
import { ListeningRoom } from "@/components/music/ListeningRoom";

export const metadata: Metadata = {
  title: "YZYARCHIVE",
  description:
    "An intimate collection of independent sounds. Browse records, explore tracks, and take a moment to listen.",
  openGraph: {
    title: "YZYARCHIVE",
    description: "Five carefully curated demo albums. Less noise, more listening.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Home() {
  return <ListeningRoom />;
}
