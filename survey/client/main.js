import * as SessionManagement from './SessionManagement.js';
import * as DataCollection from './DataCollection.js';
import * as Random from '../common/Random.js';
import { mobileCheck } from './MobileCheck.js';

import videos from '../videos.json';

async function loadVideo(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    const src = URL.createObjectURL(blob);

    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = src;

    return video;
}

async function waitTime(seconds) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, seconds * 1000);
    });
}

async function waitClick(button) {
    return new Promise((resolve, reject) => {
        button.addEventListener('click', resolve);
    });
}

async function waitChange(input) {
    return new Promise((resolve, reject) => {
        input.addEventListener('input', resolve);
        input.addEventListener('change', resolve);
    });
}

async function waitRepetitions(video, count) {
    return new Promise((resolve, reject) => {
        let lastTime = video.currentTime;
        video.addEventListener('timeupdate', e => {
            if (video.currentTime < lastTime) {
                if (--count === 0) {
                    resolve();
                }
            }
            lastTime = video.currentTime;
        });
    });
}

function createLoader() {
    const loaderContainer = document.createElement('div');
    loaderContainer.classList.add('loader-container');
    const loader = document.createElement('div');
    loader.classList.add('loader');
    loaderContainer.appendChild(loader);
    return loaderContainer;
}

function createPlayButton() {
    const playButton = document.createElement('button');
    playButton.classList.add('play-button');
    const playIcon = document.createElement('div');
    playIcon.classList.add('play-icon');
    playButton.appendChild(playIcon);
    return playButton;
}

function createSidebar() {
    const hideButton = document.createElement('div');
    hideButton.classList.add('sidebar-button-wrapper');
    hideButton.classList.add('image-circle-hide');

    const replayButton = document.createElement('div');
    replayButton.classList.add('sidebar-button-wrapper');
    replayButton.classList.add('image-replay');

    return {
        hide: hideButton,
        replay: replayButton,
    };
}

function createPoint(x, y, classname) {
    const container = document.createElement('div');
    container.classList.add('circle-container');
    container.style.left = `${(x * 100).toFixed(6)}%`;
    container.style.top = `${(y * 100).toFixed(6)}%`;

    const circle = document.createElement('div');
    circle.classList.add('circle');
    circle.classList.add(classname);
    container.appendChild(circle);

    return container;
}

function createPointOverlay({ pointA, pointB, pointC }) {
    const pointOverlay = document.createElement('div');
    pointOverlay.classList.add('overlay');

    const pointAElement = createPoint(...pointA, 'image-circle-green-hollow');
    const pointBElement = createPoint(...pointB, 'image-circle-pink-hollow');
    const pointCElement = createPoint(...pointC, 'image-circle-grey-hollow');

    pointOverlay.appendChild(pointAElement);
    pointOverlay.appendChild(pointBElement);
    pointOverlay.appendChild(pointCElement);

    return pointOverlay;
}

function createSlider() {
    const sliderWrapper = document.createElement('slider-wrapper');
    sliderWrapper.classList.add('slider-wrapper');

    const sliderTrackContainer = document.createElement('div');
    sliderTrackContainer.classList.add('slider-track-container');
    const sliderCircleContainer = document.createElement('div');
    sliderCircleContainer.classList.add('slider-circle-container');
    const sliderThumbContainer = document.createElement('div');
    sliderThumbContainer.classList.add('slider-thumb-container');
    sliderWrapper.appendChild(sliderTrackContainer);
    sliderWrapper.appendChild(sliderCircleContainer);
    sliderWrapper.appendChild(sliderThumbContainer);

    const sliderTrack = document.createElement('div');
    sliderTrack.classList.add('slider-track');
    sliderTrackContainer.appendChild(sliderTrack);

    const sliderCircleLeft = document.createElement('div');
    sliderCircleLeft.classList.add('slider-circle-wrapper');
    sliderCircleLeft.classList.add('image-circle-green-full');

    const sliderCircleRight = document.createElement('div');
    sliderCircleRight.classList.add('slider-circle-wrapper');
    sliderCircleRight.classList.add('image-circle-pink-full');

    sliderCircleContainer.appendChild(sliderCircleLeft);
    sliderCircleContainer.appendChild(sliderCircleRight);

    const sliderThumb = document.createElement('div');
    sliderThumb.classList.add('slider-circle-wrapper');
    sliderThumb.classList.add('image-circle-grey-full');
    sliderThumb.classList.add('slider-thumb');
    sliderThumbContainer.appendChild(sliderThumb);

    sliderWrapper.value = 0.5;

    function updateValue(e) {
        const rect = sliderThumbContainer.getBoundingClientRect();
        const rawValue = (e.clientX - rect.x - rect.height / 2) / (rect.width - rect.height);
        const value = Math.min(Math.max(rawValue, 0), 1);
        sliderWrapper.value = value;
        sliderThumb.style.setProperty('--value', `${(value * 100).toFixed(6)}%`);
    }

    function pointermove(e) {
        e.preventDefault(); // prevent dragging the slider thumb
        updateValue(e);
        sliderWrapper.dispatchEvent(new Event('input'));
    }

    function pointerdown(e) {
        updateValue(e);
        sliderThumbContainer.setPointerCapture(e.pointerId);
        sliderThumbContainer.addEventListener('pointermove', pointermove);
        sliderWrapper.dispatchEvent(new Event('input'));
    }

    function pointerup(e) {
        updateValue(e);
        sliderThumbContainer.releasePointerCapture(e.pointerId);
        sliderThumbContainer.removeEventListener('pointermove', pointermove);
        sliderWrapper.dispatchEvent(new Event('input'));
        sliderWrapper.dispatchEvent(new Event('change'));
    }

    sliderThumbContainer.addEventListener('pointerdown', pointerdown);
    sliderThumbContainer.addEventListener('pointerup', pointerup);

    return sliderWrapper;
}

function createSubmitButton() {
    const button = document.createElement('button');
    button.classList.add('submit-button');
    button.textContent = 'OK';
    return button;
}

function createProgressLabel({ current, count }) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('progress-wrapper');
    const label = document.createElement('span');
    label.classList.add('progress-label');
    label.textContent = `${current + 1} / ${count}`;
    wrapper.appendChild(label);
    return wrapper;
}

(async function() {

if (mobileCheck()) {
    alert('Evalvacija ne sme biti izvedena na mobilni napravi');
    return;
}

const session = SessionManagement.beginSession();
const shuffledVideos = Random.shuffle([...videos], Random.createRandom(session.sessionID));

if (!session.demographic) {
    location.href = 'demographic.html';
    return;
}

if (session.videoIndex >= videos.length || session.videoIndex < 0) {
    SessionManagement.endSession();
    location.href = 'thanks.html';
    return;
}

const currentVideoMetadata = shuffledVideos[session.videoIndex];

const progressContainer = document.querySelector('.progress-container');
const videoContainer = document.querySelector('.video-container');
const sidebarContainer = document.querySelector('.sidebar-container');
const sliderContainer = document.querySelector('.slider-container');
const buttonContainer = document.querySelector('.button-container');

const progressLabel = createProgressLabel({
    current: session.videoIndex,
    count: videos.length,
});
const loader = createLoader();
const playButton = createPlayButton();
const sidebar = createSidebar();
const pointOverlay = createPointOverlay(currentVideoMetadata);
const slider = createSlider();
const submitButton = createSubmitButton();

progressContainer.appendChild(progressLabel);

videoContainer.appendChild(loader);
const video = await loadVideo(`video/${currentVideoMetadata.url}`);
loader.remove();

videoContainer.appendChild(playButton);
if (session.stage < 1) {
    await waitClick(playButton);
    session.stage = 1;
}
playButton.remove();

videoContainer.appendChild(video);
videoContainer.appendChild(pointOverlay);
if (session.stage < 2) {
    await waitTime(2);
    session.stage = 2;
}
pointOverlay.classList.add('hidden');

if (session.stage < 3) {
    video.play();
    await waitRepetitions(video, 5);
    video.pause();
    session.stage = 3;
}
video.currentTime = 0;
pointOverlay.classList.remove('hidden');

const maxReplayCount = 1;
if (session.replayCount < maxReplayCount) {
    sidebarContainer.appendChild(sidebar.replay);
}
sidebarContainer.appendChild(sidebar.hide);

const elementsToHide = [
    sidebar.hide,
    sidebar.replay,
    pointOverlay,
    slider,
    submitButton,
];

sidebar.replay.addEventListener('click', async e => {
    if (!video.paused) {
        return;
    }

    if (session.replayCount < maxReplayCount) {
        for (const element of elementsToHide) {
            element.classList.add('hidden');
        }
        video.play();
        await waitRepetitions(video, 5);
        video.pause();
        for (const element of elementsToHide) {
            element.classList.remove('hidden');
        }
        sidebar.hide.classList.add('image-circle-hide');
        sidebar.hide.classList.remove('image-circle-show');
        session.replayCount++;
        if (session.replayCount >= maxReplayCount) {
            sidebar.replay.remove();
        }
    }
});

sidebar.hide.addEventListener('click', e => {
    sidebar.hide.classList.toggle('image-circle-hide');
    sidebar.hide.classList.toggle('image-circle-show');
    pointOverlay.classList.toggle('hidden');
});

sliderContainer.appendChild(slider);
await waitChange(slider);

buttonContainer.appendChild(submitButton);
await waitClick(submitButton);

video.remove();
slider.remove();
submitButton.remove();
pointOverlay.remove();
progressLabel.remove();

await DataCollection.post({
    type: 'video',
    sessionID: session.sessionID,
    videoID: currentVideoMetadata.hash,
    distance: Number(slider.value),
});

session.stage = 0;
session.replayCount = 0;
session.videoIndex++;

if (session.videoIndex >= videos.length || session.videoIndex < 0) {
    SessionManagement.endSession();
    location.href = 'thanks.html';
    return;
}

location.reload();

})();
