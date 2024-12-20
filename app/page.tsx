"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import jsQR from "jsqr";

export default function Page() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        context?.drawImage(image, 0, 0, image.width, image.height);
        const imageData = context?.getImageData(0, 0, image.width, image.height);
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScan(code.data);
          }
        }
      };
    }
  }, [webcamRef, canvasRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isScanning) {
        capture();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [capture, isScanning]);

  const handleScan = async (data: string) => {
    if (data) {
      setQrCode(data);
      setIsScanning(false);
      setError(null);
      try {
        const response = await fetch("https://api.studentdiscountteam.workers.dev/api/verify-qr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ qrCode: data }),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result:any = await response.json();
        console.log(result);
        if (result.verified) {
          setIsVerified(true);
        } else {
          setError("QR code not verified");
        }
      } catch (err) {
        setError("Error verifying QR code");
        console.error(err);
      }
    }
  };

  const handleVerifyMore = () => {
    setQrCode(null);
    setIsVerified(false);
    setError(null);
    setIsScanning(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {isScanning && (
        <div className="relative border-blue-500">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: { exact: "environment" } }}
            className="w-full max-w-md rounded-lg shadow-lg"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      {error && <p className="text-red-500 font-semibold mt-4">{error}</p>}
      {isVerified && (
        <div className="flex flex-col items-center">
          <div className="tick-mark">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 52 52"
              className="tick-mark-svg"
            >
              <circle
                className="tick-mark-circle"
                cx="26"
                cy="26"
                r="25"
                fill="none"
              />
              <path
                className="tick-mark-check"
                fill="none"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
              />
            </svg>
          </div>
          <button
            onClick={handleVerifyMore}
            className="mt-6 px-4 py-2 bg-blue-500 text-white font-bold rounded-sm hover:bg-green-600"
          >
            Verify More
          </button>
        </div>
      )}
      <style jsx>{`
        .tick-mark {
          width: 100px;
          height: 100px;
          margin: 0 auto;
        }
        .tick-mark-svg {
          width: 100%;
          height: 100%;
        }
        .tick-mark-circle {
          stroke: #4caf50;
          stroke-width: 2;
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-linecap: round;
          animation: dash 0.6s ease-in-out forwards;
        }
        .tick-mark-check {
          stroke: #4caf50;
          stroke-width: 2;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          stroke-linecap: round;
          animation: dash-check 0.3s 0.6s ease-in-out forwards;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes dash-check {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}