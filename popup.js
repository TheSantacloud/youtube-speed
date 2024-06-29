let channelsData = {};

function createTableRow(key, { channelUrl, playbackRate }) {
    const tr = document.createElement('tr');


    tr.innerHTML = `
        <td class="text-col"><a href="${channelUrl}" target="_blank" title="${channelUrl}" rel="noopener noreferrer">${key}</a></td>
        <td class="num-col">${playbackRate}</td>
        <td class="actions">
            <button class="delete-btn"> </button>
        </td>
    `;

    tr.querySelector('.num-col').addEventListener('dblclick', () => toggleEditMode(tr));
    tr.querySelector('.delete-btn').addEventListener('click', () => {
        tr.remove();
        delete channelsData[key];
        updateStorageChannels();
    });

    return tr;
}

function searchData(phrase) {
    let data = channelsData;
    if (phrase.length > 0) {
        let filteredChannelsData = {};
        Object.keys(channelsData).forEach(key => {
            if (key.toLowerCase().includes(phrase)) {
                filteredChannelsData[key] = channelsData[key];
            }
        });
        if (Object.keys(filteredChannelsData).length > 0) {
            data = filteredChannelsData;
        }
    }

    populateTable(data);
}

function toggleEditMode(tr) {
    const isEditing = tr.classList.toggle('editing');

    if (isEditing) {
        const playbackRate = tr.querySelector('.num-col');
        playbackRate.innerHTML = `<input type="number" step="0.5" value="${playbackRate.textContent}" style="width: 100%; box-sizing: border-box;"/>`;
        playbackRate.children[0].focus();
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

function updateStorageChannels() {
    chrome.storage.sync.set({ channelsData: channelsData });
    populateTable(channelsData);
}

function populateTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    for (const [key, value] of Object.entries(data || {})) {
        const tr = createTableRow(key, value);
        tableBody.appendChild(tr);
    }
}

function populateInstructions() {
    const instructionsContainer = document.getElementById("instructionsContainer");
    chrome.commands.getAll(function(commands) {
        commands.forEach(command => {
            const instruction = document.createElement('li');
            instruction.classList.add("instruction");
            let description = command.description;
            if (!description) {
                description = "Open popup";
            }
            instruction.innerHTML = `<span class="description">${description}</span><span class="shortcut">${command.shortcut}</span>`;
            instructionsContainer.appendChild(instruction);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('searchBox');
    searchBox.addEventListener('input', (event) => searchData(event.target.value));

    populateInstructions();

    chrome.storage.sync.get("channelsData", (data) => {
        if (data.channelsData) {
            channelsData = data["channelsData"];
        }
        populateTable(channelsData);
    });

});
