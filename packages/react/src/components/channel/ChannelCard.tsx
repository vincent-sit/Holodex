import { formatCount } from "@/lib/time";
import { Button } from "@/shadcn/ui/button";
import { ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChannelMenu } from "./ChannelMenu";
import { ChannelImg } from "./ChannelImg";
import { TopicBadge } from "../topic/TopicBadge";
import { ChannelSocials } from "./ChannelSocials";
import { Link, useNavigate } from "react-router-dom";

type WithNonOptional<T, NonOptionalKeys extends keyof T> = Pick<
  T,
  NonOptionalKeys
> &
  Partial<Omit<T, NonOptionalKeys>>;
type PartialChannel = WithNonOptional<
  Channel,
  keyof ShortChannel | "subscriber_count" | "video_count"
>;

interface ChannelCardProps extends PartialChannel {
  size: "xs" | "sm" | "md" | "lg";
  showSubscribers?: boolean;
  showVideoCount?: boolean;
  showClipCount?: boolean;
  children?: ReactNode;
}

export function ChannelCard({
  size,
  showSubscribers = true,
  showVideoCount,
  showClipCount,
  children,
  id,
  name,
  english_name,
  org,
  group,
  lang,
  type,
  photo,
  subscriber_count,
  video_count,
  clip_count,
  top_topics,
  twitter,
  twitch,
  inactive,
}: ChannelCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const channelHref = `/channel/${id}`;

  const goToChannelClickHandler = useCallback(
    (evt: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if ((evt.target as HTMLElement).closest("a")) {
        console.info("no action b/c closest element is a link.", evt);
        return;
      }
      console.info("JS video click handling", evt);
      // clicked a non-link part of the channel card.
      if (evt.ctrlKey) {
        /** Control clicking a non-link part always goes to the external link no matter what the context */
        window.open(channelHref, "_blank");
        evt.preventDefault();
        evt.stopPropagation();
      } else {
        navigate(channelHref);
        evt.preventDefault();
        evt.stopPropagation();
      }
    },
    [channelHref, navigate],
  );

  switch (size) {
    case "xs":
    case "sm":
      return (
        <div
          className="flex items-center gap-4 rounded-lg bg-base-3 p-4 hover:cursor-pointer"
          onClick={goToChannelClickHandler}
        >
          <Link to={channelHref} className="flex grow items-center gap-4">
            <ChannelImg
              className={`h-12 w-12 ${inactive && "opacity-80 saturate-50"}`}
              channelId={id}
            />
            <div className="flex flex-col overflow-hidden">
              <div className="text-xs text-base-11">
                {org}
                {group && ` / ${group}`}
              </div>
              <div className="line-clamp-1 text-lg font-bold">{name}</div>
              <div className="text-sm text-base-11">
                {showSubscribers &&
                  t("component.channelInfo.subscriberCount", {
                    n: formatCount(subscriber_count ?? "0"),
                  })}
                {showVideoCount &&
                  ` / ${t("component.channelInfo.videoCount", {
                    0: video_count ?? "0",
                  })}`}
                {showClipCount &&
                  ` / ${t("component.channelInfo.clipCount", {
                    n: clip_count ?? "0",
                  })}`}
              </div>
              {size === "sm" && (
                <div className="mt-1 flex max-w-full gap-1 overflow-x-auto">
                  {top_topics?.map((topic) => (
                    <TopicBadge size="sm" topic={topic} />
                  ))}
                </div>
              )}
            </div>
          </Link>
          {children ?? (
            <ChannelSocials
              size="sm"
              id={id}
              twitter={twitter}
              twitch={twitch}
            />
          )}
        </div>
      );

    case "lg":
      return (
        // Set min-height because react-virtuoso will break if the height is not fixed
        <div
          className="group relative flex h-full min-h-[24rem] w-full flex-col items-center gap-2 rounded-md bg-base-3 p-4 hover:cursor-pointer"
          onClick={goToChannelClickHandler}
        >
          <Link
            to={channelHref}
            className="flex grow flex-col items-center gap-2"
          >
            <ChannelMenu
              {...{
                id,
                name,
                type,
                english_name,
                org,
                group,
                lang,
                photo,
              }}
            >
              <Button
                size="icon-lg"
                variant="ghost"
                className="absolute right-4 top-4 hidden rounded-full group-hover:flex"
              >
                <div className="i-heroicons:ellipsis-vertical" />
              </Button>
            </ChannelMenu>
            <ChannelImg
              className={`-z-0 -mb-36 mt-4 h-32 w-32 opacity-20 blur-2xl ${inactive ? "brightness-75 saturate-50" : "saturate-150"}`}
              channelId={id}
            />
            <ChannelImg
              className={`z-10 h-24 w-24 ${inactive && "brightness-75 saturate-50"}`}
              channelId={id}
            />
            {/* {inactive && (
                    <div
                      className="i-fa:graduation-cap absolute z-10 h-24 w-24 text-[40px] leading-10"
                      style={{
                        transform: "translate(24px,-10px) rotate(20deg)",
                        color: "var(--base-10)",
                      }}
                    ></div>
                  )} */}
            <div
              className={`${inactive && "text-base-10"} z-10 line-clamp-2 text-center text-lg font-bold`}
            >
              {name}
            </div>
            <div className="flex flex-col items-center">
              <div className="whitespace-nowrap text-sm text-base-11">
                {t("component.channelInfo.subscriberCount", {
                  n: formatCount(subscriber_count ?? "0"),
                })}
              </div>
              <div className="flex flex-wrap justify-center gap-x-1 gap-y-0 text-sm text-base-11">
                <span className="whitespace-nowrap">
                  {t("component.channelInfo.videoCount", {
                    0: video_count ?? 0,
                  })}
                </span>
                <span>/</span>
                <span className="whitespace-nowrap">
                  {t("component.channelInfo.clipCount", {
                    n: clip_count ?? "0",
                  })}
                </span>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-0.5">
              {top_topics?.map((topic) => (
                <TopicBadge
                  size="sm"
                  topic={topic}
                  className="border-base-7 capitalize text-base-10 "
                />
              ))}
            </div>
          </Link>

          {children ?? (
            <ChannelSocials
              id={id}
              twitter={twitter}
              twitch={twitch}
              size="lg"
            />
          )}
        </div>
      );
  }
}
