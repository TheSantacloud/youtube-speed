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

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.channelsData) {
        sendChannelsData();
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
        if (!chrome.runtime.lastError && changeInfo.status === "complete") {
            sendChannelsData();
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
