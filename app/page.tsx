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
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, "0");
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const year = String(now.getUTCFullYear()).slice(2);
  const buildDate = `${day}.${month}.${year}`;
  return <ListeningRoom buildDate={buildDate} />;
}
