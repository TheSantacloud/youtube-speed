const extensionAPI = window.chrome || window.browser;
const scripting = extensionAPI.scripting || null;

function getVideoDetails() {
    const channelName = document.querySelector('ytd-video-owner-renderer ytd-channel-name').innerText;
    const channelUrl = document.querySelector('ytd-video-owner-renderer ytd-channel-name a.yt-simple-endpoint').href;
    const playbackRate = document.querySelector('video')?.playbackRate || 1.0;
    return { channelName, channelUrl, playbackRate };
}

async function executeGetVideoDetails(tabId) {
    if (extensionAPI.scripting && extensionAPI.scripting.executeScript) {
        const [result] = await extensionAPI.scripting.executeScript({
            target: { tabId },
            func: getVideoDetails,
        });
        return result.result !== undefined ? result.result : result;
    } else if (extensionAPI.tabs && extensionAPI.tabs.executeScript) {
        return new Promise((resolve, reject) => {
            extensionAPI.tabs.executeScript(
                tabId,
                { code: `(${getVideoDetails.toString()})();` },
                (results) => {
                    if (extensionAPI.runtime.lastError) {
                        return reject(extensionAPI.runtime.lastError);
                    }
                    resolve(results && results[0]);
                }
            );
        });
    } else {
        throw new Error('No supported API available to execute scripts.');
    }
}

function sendChannelsData() {
    extensionAPI.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        extensionAPI.storage.sync.get("channelsData", (data) => {
            extensionAPI.tabs.sendMessage(tabs[0].id, { channelsData: data["channelsData"] });
        });
    });
}

function sendDefaultPlaybackRate() {
    extensionAPI.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        extensionAPI.storage.sync.get("defaultPlaybackRate", (data) => {
            extensionAPI.tabs.sendMessage(tabs[0].id, { defaultPlaybackRate: data["defaultPlaybackRate"] });
        });
    });
}

extensionAPI.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (!(details && details.url.includes("youtube"))) return;
    extensionAPI.tabs.sendMessage(details.tabId, { action: "ping" }, (response) => {
        if (details.url.includes("watch?v") && !extensionAPI.runtime.lastError && response.status === "pong") {
            extensionAPI.tabs.sendMessage(details.tabId, { action: "new_video" })
                , { url: [{ "pathContains": "watch" }] }
        }
    });
});

extensionAPI.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync') return;
    if (changes.channelsData) {
        sendChannelsData();
    } else if (changes.defaultPlaybackRate
        && changes.defaultPlaybackRate.newValue != changes.defaultPlaybackRate.oldValue) {
        sendDefaultPlaybackRate();
    }
});

extensionAPI.tabs.onActivated.addListener((activeInfo) => {
    const tabId = activeInfo.tabId;
    extensionAPI.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
        if (!extensionAPI.runtime.lastError && response.status === "pong") {
            sendChannelsData();
            sendDefaultPlaybackRate();
        }
    });
});


extensionAPI.tabs.onUpdated.addListener((tabId, changeInfo) => {
    extensionAPI.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
        if (!extensionAPI.runtime.lastError && changeInfo?.status === "complete" && response?.status === "pong") {
            sendChannelsData();
            sendDefaultPlaybackRate();
        }
    });
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

extensionAPI.commands.onCommand.addListener(async (command) => {
    if (command === "increase_rate" || command === "decrease_rate") {
        extensionAPI.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            extensionAPI.tabs.sendMessage(tabs[0].id, { action: command });
        });
    } else if (command === "save_rate") {
        const tabs = await extensionAPI.tabs.query({ active: true, lastFocusedWindow: true });
        const tabId = tabs[0].id;
        let result = await executeGetVideoDetails(tabId);

        if (result.result !== undefined) {
            result = result.result;
        }
        if (!result || result === undefined) return;

        const { channelName, channelUrl, playbackRate } = result;
        extensionAPI.storage.sync.get("channelsData", (data) => {
            let channelsData = data["channelsData"] || {};
            channelsData[channelName] = { playbackRate, channelUrl };
            extensionAPI.storage.sync.set({ channelsData: channelsData }, async () => {
                await sleep(100);
                extensionAPI.tabs.sendMessage(tabId, {
                    action: "toast",
                    toastMessage: `Saved new playback rate ${playbackRate}`,
                });
            });
        });
    } else {
        console.error("unknown command");
    }
});
