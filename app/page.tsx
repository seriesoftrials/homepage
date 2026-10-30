import { HomeReveal } from "@/components/home/HomeReveal";
import { PageTransition } from "@/components/site/PageTransition";

// One screen: SERIAL unfolding into Series of Trials (through the loader on a
// first visit), with the way into the intro page. The story is told there.
export default function Home() {
  return (
    <PageTransition>
      <main>
        <HomeReveal />
      </main>
    </PageTransition>
  );
}
