import type { Metadata } from "next";
import { ListeningRoom } from "@/components/music/ListeningRoom";

export const metadata: Metadata = {
  title: "YZYARCHIVE",
  description: "Good music never dies.",
  openGraph: {
    title: "YZYARCHIVE",
    description: "Good music never dies.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Home() {
  return <ListeningRoom />;
}
