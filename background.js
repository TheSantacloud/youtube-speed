function getVideoDetails() {
    const channelName = document.querySelector('ytd-video-owner-renderer ytd-channel-name').innerText;
    const channelUrl = document.querySelector('ytd-video-owner-renderer ytd-channel-name a.yt-simple-endpoint').href;
    const playbackRate = document.querySelector('video')?.playbackRate || 1.0;
    return { channelName, channelUrl, playbackRate };
}

function sendChannelsData() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.storage.sync.get("channelsData", (data) => {
            chrome.tabs.sendMessage(tabs[0].id, { channelsData: data["channelsData"] });
        });
    });
}

function sendDefaultPlaybackRate() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.storage.sync.get("defaultPlaybackRate", (data) => {
            chrome.tabs.sendMessage(tabs[0].id, { defaultPlaybackRate: data["defaultPlaybackRate"] });
        });
    });
}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (!(details && details.url.includes("youtube"))) return;
    chrome.tabs.sendMessage(details.tabId, { action: "ping" }, (response) => {
        if (details.url.includes("watch?v") && !chrome.runtime.lastError && response.status === "pong") {
            chrome.tabs.sendMessage(details.tabId, { action: "new_video" })
                , { url: [{ "pathContains": "watch" }] }
        }
    });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync') return;
    if (changes.channelsData) {
        sendChannelsData();
    } else if (changes.defaultPlaybackRate
        && changes.defaultPlaybackRate.newValue != changes.defaultPlaybackRate.oldValue) {
        sendDefaultPlaybackRate();
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    const tabId = activeInfo.tabId;
    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
        if (!chrome.runtime.lastError && response.status === "pong") {
            sendChannelsData();
            sendDefaultPlaybackRate();
        }
    });
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
        if (!chrome.runtime.lastError && changeInfo?.status === "complete" && response?.status === "pong") {
            sendChannelsData();
            sendDefaultPlaybackRate();
        }
    });
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "increase_rate" || command === "decrease_rate") {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: command });
        });
    } else if (command === "save_rate") {
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        const tabId = tabs[0].id;
        const [result] = await chrome.scripting.executeScript({
            target: { tabId },
            func: getVideoDetails,
        });

        if (!result) return;

        const { channelName, channelUrl, playbackRate } = result.result;
        chrome.storage.sync.get("channelsData", (data) => {
            let channelsData = data["channelsData"];
            channelsData[channelName] = { playbackRate, channelUrl };
            chrome.storage.sync.set({ channelsData: channelsData }, async () => {
                await sleep(100);
                chrome.tabs.sendMessage(tabId, {
                    action: "toast",
                    toastMessage: `Saved new playback rate ${playbackRate}`,
                });
            });
        });
    } else {
        console.error("unknown command");
    }
});
