let mediaRecorder;
let recordedChunks = [];

async function startCapture(tabId) {
    try {
        const streamId = await new Promise((resolve, reject) => {
            chrome.tabCapture
                .getMediaStreamId({targetTabId: tabId},
                    (id) => {
                        if (chrome.runtime.lastError || !id) {
                            reject(new Error('Error getting streamId: ' + (chrome.runtime.lastError?.message || 'No ID returned')))
                            return
                        }
                        resolve(id)
                    }
                )
        });

        const config = {
            "video": {
                "mandatory": {
                    "chromeMediaSourceId": streamId,
                    "chromeMediaSource": "tab"
                }
            },
            "audio": {
                "mandatory": {
                    "chromeMediaSourceId": streamId,
                    "chromeMediaSource": "tab"
                }
            }
        }

        navigator.mediaDevices
            .getUserMedia(config)
            .then(function (desktop) {
                startRecording(desktop);
            });
    } catch (err) {
        console.error("Error al capturar la pestaña:", err);
    }
}

function startRecording(desktop) {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data);
    };
    mediaRecorder.start();
    let stream = new MediaStream();
    let video;
    if (desktop) {
        video = desktop.getVideoTracks()[0];
        stream.addTrack(video);
    }
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=h264',
    });

    recordedChunks = [];
    mediaRecorder.onstop = function () {
        let tracks = {};
        tracks.a = stream ? stream.getTracks() : [];
        tracks.b = desktop ? desktop.getTracks() : [];
        tracks.c = [];
        tracks.total = [...tracks.a, ...tracks.b, ...tracks.c];
        /*  */
        for (let i = 0; i < tracks.total.length; i++) {
            if (tracks.total[i]) {
                tracks.total[i].stop();
            }
        }
        stopCapture(recordedChunks)
    }
    mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };
    stream.onended = function () {
        mediaRecorder.stop()
    }
    mediaRecorder.start();
}

function stopCapture() {
    mediaRecorder.stop();
    mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, {type: "video/webm"});
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
            url: url,
            filename: "record.webm",
            saveAs: true
        });
    };
}

const registerEventListeners = () => {
    chrome.runtime.onMessage.addListener((message, _sender) => {
        if (message.startRecording !== undefined) {
            startCapture(message.startRecording.tabId).then(r => console.log('r', r));
        } else if (message.action === "pauseRecording") {
            mediaRecorder && mediaRecorder.pause();
        } else if (message.action === "stopRecording") {
            stopCapture();
        }
    });
}

(() => {
    registerEventListeners();
})();
