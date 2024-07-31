"use client";

import React, { useEffect, useState, useTransition } from "react";

import blink from "./blinkBase";
var raf;
export default function Camera2() {
  const [blinkDetection, setBlinkDetection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleint, setIsCleint] = useState(false);

  useEffect(() => {
    setIsCleint(true);
  }, []);

  useEffect(() => {
    if (isCleint) {
      init();
    }
  }, [isCleint]);

  const init = async () => {
    setIsLoading(true);

    try {
      const videoElement = document.querySelector("video");

      // Carrega o modelo
      await blink.loadModel();

      // Configura a câmera com o elemento de vídeo
      await blink.setUpCamera(videoElement);

      // Função para prever piscadas
      const predict = async () => {
        try {
          let result = await blink.getBlinkPrediction("normal");

          if (result) {
            if (result.longBlink) {
              setBlinkDetection((oldVal) => oldVal + 1);
            }
          }
        } catch (error) {
          console.error("Erro ao obter previsão de piscadas:", error);
        }

        // Chamada recursiva para prever continuamente
        raf = requestAnimationFrame(predict);
      };
      // Inicia a previsão
      predict();
    } catch (error) {
      console.error("Erro durante a inicialização:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCleint) {
    return null;
  }

  return (
    <main>
      <div
        style={{
          margin: "0 auto",
          backgroundColor: "#fafafa",
          width: "500px",
        }}
      >
        <h1 style={{ textAlign: "center" }}>Eye-Blink test</h1>
        {isLoading && <h3 style={{ textAlign: "center" }}>loading...</h3>}
        <div
          style={{
            // position: "relative",
            margin: "20px auto",
            //width: "100px",
          }}
        >
          <video id="video" playsInline />
        </div>

        <h2 style={{ textAlign: "center" }}>
          long blink count detected: {blinkDetection}
        </h2>
        <div style={{ display: "flex" }}>
          <button
            style={{
              padding: "10px",
              width: "100%",
              marginTop: "12px",
              border: "none",
              background: "rgba(255, 0, 0, .5)",
              fontSize: "20px",
            }}
            onClick={() => blink.stopPrediction()}
          >
            Stop
          </button>
          <button
            style={{
              padding: "10px",
              width: "100%",
              marginTop: "12px",
              border: "none",
              background: "rgba(0, 0, 230, .5)",
              fontSize: "20px",
            }}
            onClick={() => {
              blink.starPrediction(), setBlinkDetection(0);
            }}
          >
            Start
          </button>
        </div>
      </div>
    </main>
  );
}
