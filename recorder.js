document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('startButton')
        .addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            // const n = await chrome.tabs.get(tab.id);

            chrome.runtime.sendMessage({startRecording: {tabId: tab.id}});
            toggleButtons(true);
        });

    document.getElementById('pauseButton').addEventListener('click', () => {
        chrome.runtime.sendMessage({action: "pauseRecording"});
    });

    document.getElementById('stopButton').addEventListener('click', () => {
        chrome.runtime.sendMessage({action: "stopRecording"});
        toggleButtons(false);
    });

    function toggleButtons(isRecording) {
        document.getElementById('startButton').style.display = isRecording ? 'none' : 'block';
        document.getElementById('pauseButton').style.display = isRecording ? 'block' : 'none';
        document.getElementById('stopButton').style.display = isRecording ? 'block' : 'none';
    }
});
