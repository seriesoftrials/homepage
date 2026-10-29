import { T } from "@/components/i18n/T";
import type { Member } from "@/content/site";

// Photos live in public/people (git-ignored); the card still lays out without them.
export function MemberCard({ member, className = "" }: { member: Member; className?: string }) {
  return (
    <figure className={`flex flex-col ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[50%_50%_0_0/34%_34%_0_0] bg-[radial-gradient(ellipse_at_50%_18%,#57595e,#303237_48%,#17191c)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/people/${member.slug}-cutout.webp`}
          alt={member.name}
          loading="lazy"
          className="absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom grayscale"
        />
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-lg font-semibold tracking-[-0.02em]">{member.name}</span>
        <span className="font-mono text-[11px] tracking-[0.14em] text-(--muted) uppercase">{member.role}</span>
      </figcaption>
      <p className="mt-1 text-[13px] text-(--muted)">
        <T value={member.major} />
      </p>
    </figure>
  );
}
