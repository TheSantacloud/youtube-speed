const RATE = 0.5;
const TOAST_TIMEOUT = 0.5;
const TOAST_ID = 'yt-speed-toast';

let toastTimer;

chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === "increase_rate") {
        modifyRate(RATE);
    } else if (message.action === "decrease_rate") {
        modifyRate(-RATE);
    } else {
        console.err("Unknown command from YouTube speed");
    }
});

function modifyRate(delta) {
    let currentRate = document.querySelector("video").playbackRate;
    let newRate = currentRate + delta;

    if (newRate < 1) {
        console.err("YouTube Speed - can't have a rate lower than 1");
        return;
    } else if (newRate > 3) {
        console.err("YouTube Speed - can't have a rate higher than 3");
        return;
    }

    document.querySelector("video").playbackRate = newRate;
    document.querySelector("video").defaultPlaybackRate = newRate;
    showToast("Playback Rate: " + newRate);
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
