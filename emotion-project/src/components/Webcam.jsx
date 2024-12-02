import React, { useEffect, useRef, useState } from "react";
import ReactWebcam from "react-webcam";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
});

export function Webcam() {
  const WebCamRef = useRef();
  const canvasRef = useRef();
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [faceEmotion, setFaceEmotion] = useState("");

  const webcamWidth = 640;
  const webcamHeight = 480;

  const snap = () => {
    if (WebCamRef.current) {
      const imageSrc = WebCamRef.current.getScreenshot();
      return imageSrc;
    }
    return null;
  };

  useEffect(() => {
    const handleFaceData = (data) => {
      if (data.face && data.face[0]) {
        const faceBox = data.face[0].box;

        const adjustedFacePosition = {
          x: (faceBox[0] / webcamWidth) * canvasRef.current.width,
          y: (faceBox[1] / webcamHeight) * canvasRef.current.height,
          width: (faceBox[2] / webcamWidth) * canvasRef.current.width,
          height: (faceBox[3] / webcamHeight) * canvasRef.current.height,
        };
        setFacePosition(adjustedFacePosition);

        const emotion = data.face[0].emotion[0].emotion;
        setFaceEmotion(emotion);
      }
    };

    socket.on("result", handleFaceData);

    return () => {
      socket.off("result", handleFaceData);
    };
  }, []);

  const drawRectangle = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.rect(facePosition.x, facePosition.y, facePosition.width, facePosition.height);
    context.lineWidth = 1;
    context.strokeStyle = "green";
    context.stroke();

    if (faceEmotion) {
      const emojiMap = {
        happy: "😊",
        sad: "😢",
        angry: "😡",
        surprised: "😲",
        neutral: "😐",
      };

      const emoji = emojiMap[faceEmotion] || "🙂";
      context.font = "20px Arial";
      context.fillText(emoji, facePosition.x + 10, facePosition.y + 30);
    }
  };

  useEffect(() => {
    drawRectangle();
  }, [facePosition, faceEmotion]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const img = snap();
      if (img) {
        const data = await fetch(img);
        const blob = await data.blob();
        const arraybuffer = await blob.arrayBuffer();
        socket.emit("image", arraybuffer);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div style={{ position: "relative" }}>
        <ReactWebcam
          ref={WebCamRef}
          screenshotFormat="image/jpeg"
          width="100%"
          videoConstraints={{
            width: webcamWidth,
            height: webcamHeight,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}
