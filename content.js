const RATE = 0.5;
const TOAST_TIMEOUT_IN_MS = 500;
const TOAST_ID = 'yt-speed-toast';

let toastTimer;
let channelsData = {};
let defaultPlaybackRate = 1;

chrome.runtime.onMessage.addListener(function(message, _, sendResponse) {
    if (message.channelsData) {
        channelsData = message.channelsData;
        waitForElement('ytd-video-owner-renderer ytd-channel-name', changeRate, 10);
        return;
    } else if (message.defaultPlaybackRate) {
        defaultPlaybackRate = message.defaultPlaybackRate;
        waitForElement('ytd-video-owner-renderer ytd-channel-name', changeRate, 10);
        return;
    }

    if (message.action === "increase_rate") {
        modifyRate(RATE);
    } else if (message.action === "decrease_rate") {
        modifyRate(-RATE);
    } else if (message.action === "ping") {
        sendResponse({ status: "pong" });
    } else if (message.action === "toast") {
        notify(message["toastMessage"]);
    } else if (message.action === "new_video") {
        waitForElement('ytd-video-owner-renderer ytd-channel-name', (channelName) => {
            return waitForChannelToChange(channelName.innerText.trim(), changeRate, 10);
        }, 10);
    } else {
        console.error(`Unknown command from YouTube speed: ${JSON.stringify(message)}`);
    }
});

function waitForChannelToChange(currentChannelName, callback, retries) {
    const newChannelName = document.querySelector('ytd-video-owner-renderer ytd-channel-name').innerText.trim();

    if (newChannelName !== currentChannelName) {
        callback();
    } else {
        if (retries === 0) {
            return;
        } else {
            setTimeout(() => waitForChannelToChange(currentChannelName, callback, retries - 1), 100);
        }
    }
}

function waitForElement(selector, callback, retries) {
    if (retries == 0) {
        return;
    }
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(selector, callback, retries - 1), 100);
    }
}

function changeRate() {
    const channelNameContainer = document.querySelector('ytd-video-owner-renderer ytd-channel-name');
    const video = document.querySelector("video");

    if (!(video && channelNameContainer)) {
        console.error("Could not instantiate YouTube-speed. Please refresh");
        return;
    }

    const channelName = channelNameContainer.innerText;
    const currentRate = video.playbackRate;

    if (currentRate !== defaultPlaybackRate && video.currentTime > 3) return;

    if (channelName in channelsData && channelsData[channelName].playbackRate !== currentRate) {
        modifyRate(channelsData[channelName].playbackRate - currentRate);
    } else if (!(channelName in channelsData)) {
        modifyRate(defaultPlaybackRate - currentRate);
    }
    speedupAd(video);
}

function modifyRate(delta) {
    let video = document.querySelector("video");
    let currentRate = video.playbackRate;
    let newRate = currentRate + delta;

    if (newRate < 1 || newRate > 3) {
        console.log("YouTube speed rate is clamped between 1 and 3, and cannot be set outside it");
        return;
    }

    video.playbackRate = newRate;
    video.defaultPlaybackRate = newRate;
    video.onplay = () => onVideoSwitch(newRate);

    notify("Playback Rate: " + newRate);
    waitForElement('.ytp-menuitem-label', () => modifyPlaybackLabel(newRate), 10);
}

function onVideoSwitch(playbackRate) {
    let video = document.querySelector("video");
    video.playbackRate = playbackRate;
    speedupAd(video);
}

function speedupAd(video) {
    waitForElement(".ytp-skip-ad-button", () => {
        video.playbackRate = 16; // max allowed
    }, 10);
    waitForElement(".ytp-preview-ad", () => {
        video.playbackRate = 16; // max allowed
    }, 10);
}

function modifyPlaybackLabel(playbackRate) {
    const menuItems = document.querySelectorAll(".ytp-menuitem-label");
    const playbackItems = Array.from(menuItems)?.filter((item) => item.innerText.includes("Playback"));
    if (playbackItems.length != 1) {
        console.info("YouTube speed could not find the playback item from the settings pane. Not changing anything.");
        return;
    }
    const playbackItem = playbackItems[0];
    const settingsPane = playbackItem.parentNode;
    const playbackLabel = settingsPane.querySelector(".ytp-menuitem-content");
    playbackLabel.innerText = `${playbackRate}`;
}

function notify(message) {
    if (!document.URL.includes("watch?v")) return;

    let toast = document.getElementById(TOAST_ID);
    if (!toast) toast = spawnToast();
    toast.innerText = message;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        setTimeout(() => {
            if (toast) {
                toast.remove();
            }
        }, 100);
    }, TOAST_TIMEOUT_IN_MS);
}

function spawnToast() {
    toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.style.position = 'fixed';
    toast.style.top = '5em';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '0.3em';
    toast.style.fontSize = '4em';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.1s ease';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0.75';
    document.body.appendChild(toast);
    return toast;
}
