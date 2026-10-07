import type { Metadata } from "next";
import { ListeningRoom } from "@/components/music/ListeningRoom";

export const metadata: Metadata = {
  title: "YZYARCHIVE",
  description: "Every Kanye West album, leak, and shelved project. All in one place.",
  openGraph: {
    title: "YZYARCHIVE",
    description: "Every Kanye West album, leak, and shelved project. All in one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Home() {
  return <ListeningRoom />;
}
