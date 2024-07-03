import { VideoCardCountdownToLive } from "./VideoCardCountdownToLive";
import { formatDuration } from "@/lib/time";
import { Button } from "@/shadcn/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { VideoMenu } from "./VideoMenu";
import { cn, makeYtThumbnailUrl } from "@/lib/utils";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDuration } from "@/hooks/useDuration";
import { clsx } from "clsx";
import { VideoThumbnail } from "./VideoThumbnail";
import { usePreferredName } from "@/store/settings";

export type VideoCardType = VideoRef &
  Partial<VideoBase> &
  Partial<Video> &
  Partial<Live> &
  Partial<PlaceholderVideo>;

export type OnClickHandler = (
  part: "full" | "info" | "thumbnail" | "channel",
  event: React.MouseEvent,
) => void;

interface VideoCardProps {
  video: VideoCardType;
  size: VideoCardSize;
  /**
   * onClick handler for the Video Card, will be provided with the part and event.
   * call preventDefaults to prevent early navigation, and stopPropagation to prevent the event from bubbling.
   */
  onClick?: OnClickHandler;
  showDuration?: boolean;
}

// export const wrapper = cva({
//   variants: {
//     size: {
//       default: "h-8 gap-2 px-3.5 py-2",
//       sm: "h-6 gap-1.5 rounded-md px-1 text-xs",
//       lg: "h-10 gap-3 rounded-md px-6 text-lg ",
//       icon: "h-8 w-8",
//       "icon-lg": "h-10 w-10 text-lg",
//     },
//   },
//   defaultVariants: {
//     size: "default",
//   },
// });

const LazyVideoCardPlaceholder = React.lazy(
  () => import("./VideoCardPlaceholder"),
);

export function VideoCard({
  video,
  size,
  onClick,
  showDuration = true,
}: VideoCardProps) {
  const navigate = useNavigate();

  const isTwitch = video.link?.includes("twitch");
  const videoHref =
    !isTwitch && video.status === "live" && video.link
      ? video.link
      : `/watch/${video.id}`;

  const thumbnailSrc =
    video.type === "placeholder"
      ? video.thumbnail
      : makeYtThumbnailUrl(video.id, size);

  const externalLink =
    video.type === "placeholder" ? video.link : `https://youtu.be/${video.id}`;

  const videoTarget =
    !isTwitch && video.placeholderType === "external-stream"
      ? "_blank"
      : undefined;

  const [open, setOpen] = useState(false); // placeholder popup state.

  const goToVideoClickHandler = useCallback(
    (evt: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if ((evt.target as HTMLElement).closest("a")) {
        if (video.type === "placeholder") {
          console.info("took over click.", evt);
          setOpen(true);
          evt.preventDefault();
          evt.stopPropagation();
          return;
        }
        console.info("no action b/c closest element is a link.", evt);
        return;
      }
      console.info("JS video click handling", evt);
      // clicked a non-link part of the video card.
      if (evt.ctrlKey) {
        /** Control clicking a non-link part always goes to the external link no matter what the context */
        window.open(videoHref, "_blank");
        evt.preventDefault();
        evt.stopPropagation();
      } else {
        if (video.type === "placeholder") {
          setOpen(true);
          evt.preventDefault();
          evt.stopPropagation();
          return;
        }
        navigate(videoHref, {
          state: { video },
        });
        evt.preventDefault();
        evt.stopPropagation();
      }
    },
    [videoHref, navigate, video],
  );

  /**
   * Alt clicking always goes to the external link no matter what the context.
   */
  const goToVideoAuxClickHandler = useCallback(
    (evt: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if (evt.button === 1 && !(evt.target as HTMLElement).closest("a")) {
        console.info("goToVideoAuxClickHandler", evt);
        window.open(videoHref, "_blank");
        evt.preventDefault();
        evt.stopPropagation();
      }
    },
    [videoHref],
  );

  const videoCardClasses = useMemo(
    () => ({
      outerLayer: clsx([
        size == "list" && "rounded-sm hover:bg-base-3 @lg:px-2",
        (size == "list" || size == "sm") && "group relative flex gap-4 py-2",
        (size == "md" || size == "lg") && "group flex w-full flex-col gap-4",
        onClick && "cursor-pointer",
      ]),
      thumbnailLink: clsx([
        size == "list" &&
          "@lg:w-36 relative aspect-video w-28 shrink-0 overflow-hidden",
        size == "sm" && "@lg:w-48 relative w-36 shrink-0 overflow-hidden",
        (size == "md" || size == "lg") && "relative w-full",
      ]),
      videoTextInfo: clsx([
        (size == "list" || size == "sm") && "flex flex-col gap-1",
        (size == "md" || size == "lg") &&
          "flex min-h-[6rem] cursor-pointer flex-col gap-0",
      ]),
      titleLink: clsx([
        (size == "list" || size == "sm") &&
          "@lg:text-lg line-clamp-2 pr-4 text-sm font-bold",
        (size == "md" || size == "lg") &&
          "line-clamp-2 pr-4 text-sm font-bold md:text-[1rem] md:leading-6",
      ]),
      channelLink:
        "line-clamp-1 text-xs text-base-11 hover:text-base-12 @lg:text-sm",
      scheduleText: "text-sm @lg:text-sm text-base-11",
    }),
    [onClick, size],
  );

  const videoMenu = (
    <VideoMenu url={externalLink} video={video}>
      <Button
        variant="ghost"
        size="icon-lg"
        className="absolute right-0 top-0 h-8 w-6 rounded-sm opacity-0 group-hover:opacity-100"
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="i-heroicons:ellipsis-vertical h-6 w-6" />
      </Button>
    </VideoMenu>
  );

  const chName = usePreferredName(video.channel);

  return (
    <div
      className={videoCardClasses.outerLayer}
      onClick={(e) => (onClick ? onClick("full", e) : goToVideoClickHandler(e))}
    >
      {/* Thumbnail for the video */}
      <Link
        to={videoHref}
        target={videoTarget}
        state={{ video }}
        className={videoCardClasses.thumbnailLink}
        onClick={(e) =>
          onClick ? onClick("thumbnail", e) : goToVideoClickHandler(e)
        }
      >
        <VideoThumbnail
          src={thumbnailSrc}
          className={
            (video.type === "placeholder" &&
              "brightness-75 saturate-[0.75] transition-[filter] duration-300 ease-in-out group-hover:brightness-100 group-hover:saturate-100") +
            " aspect-video h-full w-full rounded-md object-cover "
          }
        />
        {video.topic_id && (
          <span className="absolute left-1 top-1 text-pretty rounded-sm bg-black/80 px-1 text-sm capitalize text-white/80 group-hover:text-white">
            {video.topic_id.replaceAll("_", " ")}
          </span>
        )}
        <div className="absolute bottom-1 right-1 flex flex-col items-end gap-1">
          {video.songcount && (
            <span className="text-pretty rounded-sm bg-black/80 px-1 text-sm capitalize text-white/80 group-hover:text-white">
              <div
                className="i-lucide:music-4 inline-block align-middle"
                style={{ fontSize: "11px", lineHeight: "1.25rem" }}
              />
              &nbsp;{video.songcount}
            </span>
          )}
          {showDuration && <VideoCardDuration className="" {...video} />}
        </div>
      </Link>
      {/* This block contains the entire bottom of the video card, which is the channel thumbnail + Video Text Info + Menu */}
      <div className="relative flex grow gap-2 @sm:gap-1">
        {/* Channel thumbnail, only drawn on large & medium video cards */}
        {(size == "lg" || size == "md") && video.channel && (
          <Link
            to={`/channel/${video.channel.id}`}
            id="channelLink"
            className="shrink-0"
            onClick={(e) => onClick && onClick("channel", e)}
          >
            <img
              src={video.channel.photo ?? ""}
              className="h-8 w-8 rounded-full"
            />
          </Link>
        )}

        {/* This block contains the Video Text Info: Title, Channel, Schedule. */}
        <div
          className={videoCardClasses.videoTextInfo}
          onClick={goToVideoClickHandler}
          onMouseDown={goToVideoAuxClickHandler}
        >
          <Link
            className={videoCardClasses.titleLink}
            to={videoHref}
            state={{ video }}
            target={videoTarget}
            onClick={(e) =>
              onClick ? onClick("info", e) : goToVideoClickHandler(e)
            }
          >
            {video.title}
          </Link>
          {video.channel && (
            <Link
              className={videoCardClasses.channelLink}
              id="channelLink"
              to={`/channel/${video.channel.id}`}
              onClick={(e) => onClick && onClick("channel", e)}
            >
              {chName}
            </Link>
          )}
          {size != "xs" && (
            <div className={videoCardClasses.scheduleText}>
              <VideoCardCountdownToLive video={video} />
            </div>
          )}
        </div>
        {videoMenu}
        <div onClick={stopPropagation} onMouseDown={stopPropagation}>
          <LazyVideoCardPlaceholder
            open={open}
            setOpen={setOpen}
            video={video}
          />
        </div>
      </div>
    </div>
  );
}

function stopPropagation<
  T extends React.MouseEvent<HTMLDivElement, MouseEvent>,
>(e: T) {
  e.stopPropagation();
}

function VideoCardDuration({
  type,
  status,
  duration,
  start_actual,
  end_actual,
  link,
  placeholderType,
  className,
}: Pick<
  VideoCardType,
  | "type"
  | "status"
  | "duration"
  | "start_actual"
  | "end_actual"
  | "link"
  | "placeholderType"
> & { className?: string }) {
  const { t } = useTranslation();

  const isPremiere = type === "stream" && status === "upcoming" && duration;

  // Duration in ms:
  // duration * 1000 (archive) or end_actual - start_actual (archive) or Date.now - start_actual (live)
  const durationMs = useDuration({
    type,
    status,
    duration: duration ?? 0,
    end_actual,
    start_actual,
  });

  return durationMs ?? status === "upcoming" ? (
    <span
      className={cn(
        "flex items-center justify-center gap-1 whitespace-nowrap rounded-sm bg-black/80 px-1 text-sm text-white/80 group-hover:text-white",
        { "bg-red-700/80": status === "live" },
        className,
      )}
    >
      {placeholderType &&
        (link?.includes("twitch") ? (
          <div className="i-lucide:twitch" />
        ) : placeholderType === "external-stream" ? (
          <div className="i-lucide:radio m-1 text-lg" />
        ) : (
          <div className="i-lucide:youtube m-1 text-lg" />
        ))}
      {isPremiere
        ? t("component.videoCard.premiere")
        : durationMs && formatDuration(durationMs)}
    </span>
  ) : null;
}
