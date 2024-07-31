import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";

let model, video, event;
const VIDEO_SIZE = 500;
let rendering = true;
let blinkCount = 0;
const EAR_THRESHOLD_MIN = 0.17; // tem quer ser dinamico
let settingSpeedBlink = "slowly";
let arrayValues = [];

//--- Boa Iluminação 100px  5 segundos de dados
//--- olhos abertos Mediana 0.3149814657560082, Media 0.3148280040283045
//--- olhos fechados Mediana 0.12388277000008477, Media 0.12156115022859626
//----------------------------------------------------------------

//--- pouca Iluminação 100px 5 segundos de dados
//--- olhos abertos Mediana 0.29580127363957875, Media 0.29613911320316205
//--- olhos fechados Mediana 0.09325393093958181, Media 0.09625106618615813

const speedBlink = {
  slowly: 23, // 23 ciclos
  normal: 20, // 22 ciclos
  fast: 17, // 21 ciclos
};

const checkSpeedBlink = (config) => {
  return speedBlink[config] || 23;
};

const loadModel = async () => {
  await tf.setBackend("webgl");
  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    { maxFaces: 1 }
  );
};

const setUpCamera = async (videoElement) => {
  video = videoElement;
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();

  const defaultWebcam = mediaDevices.find(
    (device) =>
      device.kind === "videoinput" && device.label.includes("Built-in")
  );

  const cameraId = defaultWebcam ? defaultWebcam?.deviceId : undefined;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      deviceId: cameraId,
      width: VIDEO_SIZE,
      height: VIDEO_SIZE,
    },
  });

  video.srcObject = stream;
  video.width = VIDEO_SIZE;
  video.height = VIDEO_SIZE;

  // Retorna um Promise para indicar quando o vídeo está pronto
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play(); // Inicia a reprodução do vídeo quando os metadados são carregados
      resolve(video); // Resolve o Promise com o elemento de vídeo
    };
  });
};

function stopPrediction() {
  // let mid = Math.round(arrayValues.length / 2);
  // arrayValues.sort((a, b) => a - b);
  // console.log("Mediana", arrayValues[mid]);
  // const sum = arrayValues.reduce((accumulator, currentValue) => {
  //   return accumulator + currentValue;
  // }, 0);
  // console.log("Media", sum / arrayValues.length);
  rendering = false;
}
function starPrediction() {
  arrayValues = [];
  rendering = true;
}

function getEucledianDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function getEAR(upper, lower) {
  return (
    (getEucledianDistance(upper[5][0], upper[5][1], lower[4][0], lower[4][1]) +
      getEucledianDistance(
        upper[3][0],
        upper[3][1],
        lower[2][0],
        lower[2][1]
      )) /
    (2 *
      getEucledianDistance(upper[0][0], upper[0][1], upper[8][0], upper[8][1]))
  );
}

function longBlinkDetected(bothEAR) {
  if (bothEAR) {
    blinkCount++;
    if (blinkCount === speedBlink[settingSpeedBlink]) {
      return true;
    }
  } else {
    blinkCount = 0;
  }
  return false;
}

async function renderPrediction(speedBlink = settingSpeedBlink) {
  settingSpeedBlink = speedBlink;
  if (rendering) {
    const predictions = await model.estimateFaces({
      input: video,
      returnTensors: false,
      flipHorizontal: false,
      predictIrises: true,
    });

    if (predictions.length > 0) {
      predictions.forEach((prediction) => {
        // NOTE: Error in docs, rightEyeLower0 is mapped to rightEyeUpper0 and vice-vers
        let lowerRight = prediction.annotations.rightEyeUpper0;
        let upperRight = prediction.annotations.rightEyeLower0;
        const rightEAR = getEAR(upperRight, lowerRight);

        // TODO: log this prediction
        let lowerLeft = prediction.annotations.leftEyeUpper0;
        let upperLeft = prediction.annotations.leftEyeLower0;
        const leftEAR = getEAR(upperLeft, lowerLeft);

        // let blinked = leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD;

        const bothEAR = (leftEAR + rightEAR) / 2;

        console.log(bothEAR);

        arrayValues.push(bothEAR);

        let blinked = bothEAR <= EAR_THRESHOLD_MIN;

        event = {
          left: leftEAR <= EAR_THRESHOLD_MIN,
          right: rightEAR <= EAR_THRESHOLD_MIN,
          wink: leftEAR <= EAR_THRESHOLD_MIN || rightEAR <= EAR_THRESHOLD_MIN,
          blink: blinked,
          longBlink: longBlinkDetected(blinked),
        };
      });
    }
  }
  return event;
}
const blink = {
  loadModel: loadModel,
  setUpCamera: setUpCamera,
  stopPrediction: stopPrediction,
  starPrediction: starPrediction,
  getBlinkPrediction: renderPrediction,
};

export default blink;
