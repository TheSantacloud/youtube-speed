let channelsData = {};

function createTableRow(key, { channelUrl, playbackRate }) {
    const tr = document.createElement('tr');


    tr.innerHTML = `
        <td class="text-col"><a href="${channelUrl}">${key}</a></td>
        <td class="num-col">${playbackRate}</td>
        <td class="actions">
            <button class="edit-btn">&#x270E;</button>
            <button class="delete-btn">&#x2716;</button>
        </td>
    `;

    tr.querySelector('.edit-btn').addEventListener('click', () => toggleEditMode(tr));
    tr.querySelector('.delete-btn').addEventListener('click', () => {
        tr.remove();
        delete channelsData[key];
        updateStorageChannels();
    });

    return tr;
}

function toggleEditMode(tr) {
    const isEditing = tr.classList.toggle('editing');
    const editButton = tr.querySelector('.edit-btn');

    if (isEditing) {
        editButton.innerHTML = '&#x2714;';
        const playbackRate = tr.querySelector('.num-col');
        playbackRate.innerHTML = `<input type="number" step="0.5" value="${playbackRate.textContent}" />`;
        playbackRate.addEventListener('keydown', event => {
            if (event.key === 'Enter') saveRow(tr);
        });
    } else {
        saveRow(tr);
    }
}

function saveRow(tr) {
    const channelName = tr.querySelector('.text-col').innerText;
    const ratio = tr.querySelector('.num-col input');

    if (channelName && ratio) {
        tr.querySelector('.num-col').textContent = parseFloat(ratio.value);

        tr.classList.remove('editing');
        tr.querySelector('.edit-btn').innerHTML = '&#x270E;';
    }

    channelsData[channelName]["playbackRate"] = ratio.value;
    updateStorageChannels();
}

async function addCurrentParams() {
    try {
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        const tabId = tabs[0].id;

        const [result] = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                const channelName = document.querySelector('ytd-video-owner-renderer ytd-channel-name').innerText;
                const channelUrl = document.querySelector('ytd-video-owner-renderer ytd-channel-name a.yt-simple-endpoint').href;
                const playbackRate = document.querySelector('video')?.playbackRate || 1.0;
                return { channelName, channelUrl, playbackRate };
            },
        });

        const { channelName, channelUrl, playbackRate } = result.result;
        channelsData[channelName] = { playbackRate, channelUrl };
        updateStorageChannels();
    } catch (error) {
        console.error('Error adding current params:', error);
    }
}

function updateStorageChannels() {
    chrome.storage.sync.set({ channelsData: channelsData });
    populateTable();
}

function populateTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    for (const [key, value] of Object.entries(channelsData || {})) {
        const tr = createTableRow(key, value);
        tableBody.appendChild(tr);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('addButton');
    addButton.addEventListener('click', addCurrentParams);

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async function(tabs) {
        addButton.disabled = !tabs[0].url?.includes("youtube.com");
    });

    chrome.storage.sync.get("channelsData", (data) => {
        if (data.channelsData) {
            channelsData = data["channelsData"];
        }
        populateTable();
    });

});
