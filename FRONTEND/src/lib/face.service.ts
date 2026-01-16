
import * as faceapi from '@vladmandic/face-api';

// Use a public CDN for models to avoid large local files
// In production, these should be hosted locally in /public/models
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export const loadModels = async () => {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("FaceAPI Models Loaded");
    } catch (err) {
        console.error("Failed to load FaceAPI models", err);
    }
};

export const detectFace = async (video: HTMLVideoElement): Promise<Float32Array | null> => {
    const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions()
    )
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        return null;
    }

    return detection.descriptor;
};
