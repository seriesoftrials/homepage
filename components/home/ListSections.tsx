import { LoopAperture } from "@/components/motion/LoopAperture";
import { SectionCover } from "@/components/motion/SectionCover";
import { activities, values } from "@/content/site";
import { CardStack } from "./CardStack";

export function ValuesSection() {
  return (
    <LoopAperture theme="ink" cover={<SectionCover title={values.title} />}>
      <CardStack items={values.items} />
    </LoopAperture>
  );
}

export function ActivitiesSection() {
  return (
    <LoopAperture theme="paper" cover={<SectionCover title={activities.title} />}>
      <CardStack items={activities.items} />
    </LoopAperture>
  );
}
