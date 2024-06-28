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

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "increase_rate" || command === "decrease_rate") {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: command });
        });
    } else {
        console.error("unknown command");
    }
});
