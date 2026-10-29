import { LoopAperture } from "@/components/motion/LoopAperture";
import { TrialCover } from "@/components/motion/TrialCover";
import { activities, values } from "@/content/site";
import { IndexedList } from "./IndexedList";

export function ValuesSection() {
  return (
    <LoopAperture theme="ink" cover={<TrialCover trial={values.trial} title={values.title} />}>
      <IndexedList items={values.items} />
    </LoopAperture>
  );
}

export function ActivitiesSection() {
  return (
    <LoopAperture theme="paper" cover={<TrialCover trial={activities.trial} title={activities.title} />}>
      <IndexedList items={activities.items} />
    </LoopAperture>
  );
}
