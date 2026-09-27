import { cn } from "@/lib/utils";
import { getAvatar } from "../avatars";

const sizes = {
  sm: "size-10 text-xl",
  md: "size-16 text-3xl",
  lg: "size-24 text-5xl",
};

export function Avatar({
  avatarId,
  size = "md",
  className,
}: {
  avatarId: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const avatar = getAvatar(avatarId);
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-full bg-linear-135", avatar.className, sizes[size], className)}
      role="img"
      aria-label={`Avatar ${avatar.name}`}
    >
      <span aria-hidden className="select-none">
        {avatar.emoji}
      </span>
    </div>
  );
}
