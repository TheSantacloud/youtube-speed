chrome.commands.onCommand.addListener(async (command) => {
    if (command === "increase_rate" || command === "decrease_rate") {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: command });
        });
    } else {
        console.error("unknown command");
    }
});

