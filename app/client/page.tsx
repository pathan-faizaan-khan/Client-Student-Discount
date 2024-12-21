"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import useAuth from "../hooks/useauth";
const saveAs = require("file-saver").saveAs;
import * as XLSX from "xlsx";

export const runtime = "edge";

interface ClientData {
  name: string;
  college: string;
  productJSON: string;
}

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [clientData, setClientData] = useState<ClientData[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleScan = useCallback(
    async (data: string) => {
      if (!user || !user.uid) {
        setError("User is not authenticated. Cannot verify QR code.");
        return;
      }
  
      if (data) {
        setQrCode(data);
        setIsScanning(false);
        setError(null);
        try {
          const verifyResponse = await fetch(
            "https://api.studentdiscountteam.workers.dev/api/verify-qr",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ qrCode: data, clientUid: user.uid }),
            }
          );
  
          if (!verifyResponse.ok) {
            throw new Error("Network response was not ok");
          }
  
          const verifyResult: { verified: boolean; error?: string } =
            await verifyResponse.json();
          if (verifyResult.verified) {
            setIsVerified(true);
            fetchClientData(user.uid);
          } else {
            setError(
              `QR code not verified`
            );
          }
        } catch (err) {
          setError("Error verifying QR code");
          console.error(err);
        }
      }
    },
    [user]
  );

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
  }, [webcamRef, canvasRef, handleScan]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (isScanning) {
        capture();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [capture, isScanning]);
  

  const fetchClientData = async (uid: string) => {
    try {
      const response = await fetch(
        "https://api.studentdiscountteam.workers.dev/api/getclientdata",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch client data");
      }

      const data: ClientData[] = await response.json();
      setClientData(data);
    } catch (err) {
      setError("Error fetching client data");
      console.error(err);
    }
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(clientData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Client Data");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "client_data.xlsx");
  };

  const handleVerifyMore = () => {
    setQrCode(null);
    setError(null);
    setIsScanning(false);
  };

  if (loading) {
    return (
      <div className="z-20 w-full h-full flex justify-center items-center mt-56">
        <img src="loading.svg" className="size-20" alt="loading...." />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center  min-h-screen p-4">
      {!isScanning  && (
        <button
          onClick={() => setIsScanning(true)}
          className="mb-4 mt-20 px-4 py-2 bg-blue-600 text-white font-sans font-semibold rounded-full hover:bg-blue-700"
        >
          Open Camera
        </button>
      )}
      {isScanning && (
        <div className="relative border-blue-500">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-full max-w-md rounded-lg shadow-lg"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      {error && <p className="text-red-600 font-semibold mt-4 font-serif">{error}</p>}
      <button
            onClick={handleVerifyMore}
            className={`${isScanning? "visible":"hidden"} px-4 mt-4 py-2 bg-blue-600 text-white font-sans font-semibold rounded-full hover:bg-blue-600`}
          >
            {isScanning ? "Close Camera" : ""}
        </button>
      {isVerified && !isScanning && (
        <div className="flex flex-col items-center">
          <table className="table-auto border-collapse mt-6">
            <thead className="bg-[#ff820d] text-white">
              <tr>
                <th className="border border-black   px-4 py-2 ">Name</th>
                <th className="border border-black  px-4 py-2">College</th>
                <th className="border border-black  px-4 py-2">Product</th>
                <th className="border border-black  px-4 py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {clientData.map((item, index) => {
                const products = JSON.parse(item.productJSON || "[]");
                return (
                  <React.Fragment key={index}>
                    {products.map((product:any, productIndex:number) => (
                      <tr key={`${index}-${productIndex}`}>
                        {productIndex === 0 && (
                          <>
                            <td
                              rowSpan={products.length}
                              className="border border-black  px-4 py-2"
                            >
                              {item.name}
                            </td>
                            <td
                              rowSpan={products.length}
                              className="border border-black  px-4 py-2"
                            >
                              {item.college}
                            </td>
                          </>
                        )}
                        <td className="border border-black  px-4 py-2">
                          {product.product}
                        </td>
                        <td className="border border-black  px-4 py-2">
                          {product.count}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <button
            onClick={()=> {
                clientData.length > 0 ? downloadExcel() : fetchClientData(user.uid);
            }}
            className="mt-4 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700"
          >
            {clientData.length > 0 ? "Download Excel" : "Fetch Data"}
          </button>
          
        </div>
      )}
    </div>
  );
};

export default Dashboard;
