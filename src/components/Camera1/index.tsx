"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

import Webcam from "react-webcam";
import { CameraOptions, useFaceDetection } from "react-use-face-detection";
import FaceDetection from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

const width = 500;
const height = 500;

export default function Camera1() {
  const imgRef = useRef(null);

  const { webcamRef, boundingBox, isLoading, detected, facesDetected } =
    useFaceDetection({
      faceDetectionOptions: {
        model: "short",
      },
      faceDetection: new FaceDetection.FaceDetection({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      }),
      camera: ({ mediaSrc, onFrame }: CameraOptions) =>
        new Camera(mediaSrc, {
          onFrame,
          width,
          height,
        }),
      handleOnResults: (result) => {
        console.log(result);
      },
    });

  return (
    <main>
      <div>
        <p>{`Loading: ${isLoading}`}</p>
        <p>{`Face Detected: ${detected}`}</p>
        <p>{`Number of faces detected: ${facesDetected}`}</p>
        <div style={{ width, height, position: "relative" }}>
          {boundingBox.map((box, index) => (
            <div
              key={`${index + 1}`}
              style={{
                border: "4px solid red",
                position: "absolute",
                top: `${box.yCenter * 100}%`,
                left: `${box.xCenter * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`,
                zIndex: 1,
              }}
            />
          ))}
          <Webcam
            ref={webcamRef}
            forceScreenshotSourceSize
            style={{
              height,
              width,
              position: "absolute",
            }}
          />
        </div>
      </div>
    </main>
  );
}
