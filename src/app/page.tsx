import { Feed } from "@/components/feed";
import { Nav } from "@/components/nav";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-16 min-h-screen py-20">
      <Feed />
    </div>
  );
}
