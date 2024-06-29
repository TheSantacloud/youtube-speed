const RATE = 0.5;
const TOAST_TIMEOUT = 0.5;
const TOAST_ID = 'yt-speed-toast';

let toastTimer;
let channelsData = {};

chrome.runtime.onMessage.addListener(function(message, _, sendResponse) {
    if (message.channelsData) {
        channelsData = message.channelsData;
        waitForElement('ytd-video-owner-renderer ytd-channel-name', changeRate);
        return;
    }

    if (message.action === "increase_rate") {
        modifyRate(RATE);
    } else if (message.action === "decrease_rate") {
        modifyRate(-RATE);
    } else if (message.action === "ping") {
        sendResponse({ status: "pong" });
    } else if (message.action === "toast") {
        showToast(message["toastMessage"]);
    } else {
        console.error(`Unknown command from YouTube speed: ${message}`);
    }
});

function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(selector, callback), 100);
    }
}

function changeRate() {
    const channelName = document.querySelector('ytd-video-owner-renderer ytd-channel-name').innerText;
    const currentRate = document.querySelector("video").playbackRate;

    if (!channelsData[channelName]) return;

    modifyRate(channelsData[channelName].playbackRate - currentRate);
}

function modifyRate(delta) {
    let video = document.querySelector("video");
    let currentRate = video.playbackRate;
    let newRate = currentRate + delta;

    if (newRate < 1) {
        console.error("YouTube Speed - can't have a rate lower than 1");
        return;
    } else if (newRate > 3) {
        console.error("YouTube Speed - can't have a rate higher than 3");
        return;
    }

    video.playbackRate = newRate;
    video.defaultPlaybackRate = newRate;
    video.onplay = () => video.playbackRate = newRate;

    showToast("Playback Rate: " + newRate);
    waitForElement('.ytp-menuitem-label', () => modifyPlaybackLabel(newRate));
}

function modifyPlaybackLabel(playbackRate) {
    const menuItems = document.querySelectorAll(".ytp-menuitem-label");
    console.log(menuItems);
    const playbackItems = Array.from(menuItems)?.filter((item) => item.innerText.includes("Playback"));
    if (playbackItems.length != 1) {
        console.log(playbackItems);
        console.warn("YouTube speed could not find the playback item from the settings pane. Not changing anything.");
        return;
    }
    const playbackItem = playbackItems[0];
    const settingsPane = playbackItem.parentNode;
    const playbackLabel = settingsPane.querySelector(".ytp-menuitem-content");
    playbackLabel.innerText = `${playbackRate}`;
}

function showToast(message) {
    let toast = document.getElementById(TOAST_ID);

    if (!toast) {
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
        document.body.appendChild(toast);
    }

    toast.innerText = message;
    toast.style.opacity = '0.75';

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast) {
                toast.remove();
            }
        }, 100);
    }, 500);
}
