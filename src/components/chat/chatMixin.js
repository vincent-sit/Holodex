// Loads store settings, exposes loadHistory and parseMessage function
import api from "@/utils/backend-api";
import { formatDuration, dayjs } from "@/utils/time";
import { syncState } from "@/utils/functions";
import { mdiArrowExpand, mdiSubtitlesOutline } from "@mdi/js";

export default {
    data() {
        return {
            mdiArrowExpand,
            mdiSubtitlesOutline,
            tlHistory: [],
            MESSAGE_TYPES: Object.freeze({
                END: "end",
                ERROR: "error",
                INFO: "info",
                MESSAGE: "message",
                UPDATE: "update",
            }),
            expanded: false,
            historyLoading: false,
            completed: false,
            limit: 20,

            subtitleToggle: true,
        };
    },
    props: {
        video: {
            type: Object,
            required: false,
        },
        currentTime: {
            type: Number,
            default: 0,
        },
        // For multiview
        useLocalSubtitleToggle: {
            type: Boolean,
        },
    },
    computed: {
        lang() {
            return this.$store.state.settings.lang;
        },
        ...syncState("settings", [
            "liveTlStickBottom",
            "liveTlLang",
            "liveTlFontSize",
            "liveTlShowVerified",
            "liveTlShowModerator",
            "liveTlWindowSize",
            "liveTlShowVtuber",
            "liveTlShowSubtitle",
        ]),
        showSubtitle: {
            get() {
                return this.useLocalSubtitleToggle ? this.subtitleToggle : this.liveTlShowSubtitle;
            },
            set(val) {
                this.useLocalSubtitleToggle ? this.subtitleToggle = val : this.liveTlShowSubtitle = val;
            },
        },
        blockedNames() {
            return this.$store.getters["settings/liveTlBlockedNames"];
        },
        startTimeMillis() {
            return Number(dayjs(this.video.available_at));
        },
    },
    watch: {
        liveTlShowVerified() {
            this.loadMessages(true, true);
        },
        liveTlShowModerator() {
            this.loadMessages(true, true);
        },
        liveTlShowVtuber() {
            this.loadMessages(true, true);
        },
    },
    mounted() {
        this.showSubtitle = this.liveTlShowSubtitle;
    },
    methods: {
        loadMessages(firstLoad = false, loadAll = false) {
            this.historyLoading = true;
            const lastTimestamp = !firstLoad && this.tlHistory[0]?.timestamp;
            api.chatHistory(this.video.id, {
                lang: this.liveTlLang,
                verified: this.liveTlShowVerified,
                moderator: this.liveTlShowModerator,
                vtuber: this.liveTlShowVtuber,
                limit: loadAll ? 100000 : this.limit,
                ...(lastTimestamp && { before: lastTimestamp }),
            })
                .then(({ data }) => {
                    this.completed = data.length !== this.limit || loadAll;
                    const filtered = data.filter((m) => !this.blockedNames.has(m.name));
                    if (firstLoad) this.tlHistory = filtered.map(this.parseMessage);
                    else this.tlHistory.unshift(...filtered.map(this.parseMessage));

                    // Set last message as breakpoint, used for maintaing scrolling and styling
                    if (this.tlHistory.length) this.tlHistory[0].breakpoint = true;
                    this.curIndex = 0;
                })
                .catch((e) => {
                    console.error(e);
                })
                .finally(() => {
                    this.historyLoading = false;
                });
        },
        parseMessage(msg) {
            msg.timestamp = +msg.timestamp;
            msg.relativeSeconds = (msg.timestamp - this.startTimeMillis) / 1000;
            msg.key = msg.name + msg.timestamp + msg.message;
            // Check if there's any emojis represented as URLs formatted by backend
            if (msg.message.includes("https://") && !msg.message.includes("<img")) {
                // match a :HUMU:https://<url>
                const regex = /(\S+)(https:\/\/(yt\d+\.ggpht\.com\/\S+-c-k-nd|www\.youtube\.com\/\S+\.svg))/gi;
                msg.message = msg.message.replace(regex, '<img src="$2" alt="$1" style="width: auto; height: 1.3em; vertical-align: middle;" />');
            }
            return msg;
        },
    },
};
