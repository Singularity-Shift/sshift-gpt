import React, { useRef, useState, useEffect } from 'react';
import { X, Paintbrush, Eraser, Download } from 'lucide-react';
import backend, { toolsApi } from '../../services/backend';
import { useAuth } from '../../context/AuthProvider';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

enum ModelType {
  V_2 = 'V_2',
  V_2_TURBO = 'V_2_TURBO'
}

enum BrushMode {
  PAINT = 'paint',
  ERASE = 'erase'
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  const { jwt, walletAddress } = useAuth();
  const [model, setModel] = useState<ModelType>(ModelType.V_2_TURBO);
  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(20);
  const [brushMode, setBrushMode] = useState<BrushMode>(BrushMode.PAINT);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [previewMask, setPreviewMask] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);

  const updateBrushSettings = (context: CanvasRenderingContext2D) => {
    if (brushMode === BrushMode.PAINT) {
      // Use solid black for the mask - areas to edit
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = 'black';
      context.fillStyle = 'black';
    } else {
      // Use destination-out to erase (which will reveal the white background)
      context.globalCompositeOperation = 'destination-out';
      context.strokeStyle = 'black';
      context.fillStyle = 'black';
    }
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const context = canvasRef.current.getContext('2d', { willReadFrequently: true });
      setCtx(context);
    }
  }, [isOpen]);

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        setImageLoaded(true);
        // Store original dimensions
        setOriginalDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        if (canvasRef.current && ctx) {
          // Set canvas to original image dimensions
          canvasRef.current.width = img.naturalWidth;
          canvasRef.current.height = img.naturalHeight;
          updateBrushSettings(ctx);
        }
      };
    }
  }, [ctx, brushSize]);

  useEffect(() => {
    if (ctx) {
      updateBrushSettings(ctx);
    }
  }, [brushMode, brushSize]);

  const getScaledCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !originalDimensions) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = originalDimensions.width / rect.width;
    const scaleY = originalDimensions.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    const { x, y } = getScaledCoordinates(e);
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getScaledCoordinates(e);
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearMask = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    updateBrushSettings(ctx);
  };

  const createMaskImage = async (): Promise<Blob> => {
    if (!canvasRef.current || !ctx) throw new Error('Canvas not initialized');

    // Create a new canvas for the mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvasRef.current.width;
    maskCanvas.height = canvasRef.current.height;
    const maskCtx = maskCanvas.getContext('2d')!;

    // Fill with white background (areas to keep)
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw the canvas content directly onto the mask
    maskCtx.drawImage(canvasRef.current, 0, 0);

    // Get the image data to ensure it's a proper binary mask
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;

    // Ensure the mask is binary - pure black or pure white
    for (let i = 0; i < data.length; i += 4) {
      // If any of the RGB channels are dark (< 128), make it pure black (areas to edit)
      if (data[i] < 128 || data[i + 1] < 128 || data[i + 2] < 128) {
        data[i] = 0;       // R
        data[i + 1] = 0;   // G
        data[i + 2] = 0;   // B
        data[i + 3] = 255; // A (fully opaque)
      } else {
        // Otherwise make it pure white (areas to keep)
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 255; // A (fully opaque)
      }
    }

    // Put the processed image data back
    maskCtx.putImageData(imageData, 0, 0);

    // For debugging - display the mask in the console
    console.log('Mask created with dimensions:', maskCanvas.width, 'x', maskCanvas.height);
    console.log('Mask colors: BLACK = areas to edit, WHITE = areas to keep');
    
    // Convert the canvas to a blob with PNG format to preserve transparency
    return new Promise((resolve) => {
      maskCanvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 1.0); // Use highest quality
    });
  };

  const handleSendEdit = async () => {
    try {
      if (!jwt) {
        throw new Error('No authentication token found');
      }

      setIsProcessing(true);
      
      // Create the mask image
      const maskBlob = await createMaskImage();
      
      // Create form data for mask upload
      const formData = new FormData();
      formData.append('file', maskBlob, 'mask.png');

      // Upload the mask to the bucket using the dedicated mask endpoint
      const maskResponse = await backend.post('/bucket/mask', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${jwt}`
        },
      });

      const maskUrl = maskResponse.data.url;
      console.log('Mask uploaded successfully:', maskUrl);

      // Log the dimensions of the original image for debugging
      if (originalDimensions) {
        console.log('Original image dimensions:', originalDimensions.width, 'x', originalDimensions.height);
      }

      // Send edit request to ideogram endpoint
      const editPayload = {
        imageUrl: imageUrl,
        maskUrl: maskUrl,
        prompt: prompt || "Maintain the original image style and composition",
        model: model,
        magic_prompt_option: 'AUTO',
        num_images: 1
      };

      console.log('Sending edit request with payload:', editPayload);

      const editResponse = await toolsApi.post('/ideogram/edit', editPayload, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      console.log('Edit response:', editResponse.data);
      
      // Set the edited image URL and show it
      setEditedImageUrl(editResponse.data.url);
      setShowOriginal(false);
      
    } catch (error) {
      console.error('Error in edit process:', error);
      if (error instanceof Error) {
        alert(`Failed to process edit: ${error.message}`);
      } else {
        alert('Failed to process edit. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePreviewMask = () => {
    if (!canvasRef.current || !ctx) return;
    setPreviewMask(!previewMask);
  };

  const toggleImage = () => {
    if (editedImageUrl) {
      setShowOriginal(!showOriginal);
    }
  };

  const downloadEditedImage = async () => {
    if (!editedImageUrl) return;
    
    let filename;
    try {
      console.log('Source URL:', editedImageUrl);
      const urlObj = new URL(editedImageUrl);
      const segments = urlObj.pathname.split('/');
      console.log('URL segments:', segments);
      const bucketIndex = segments.findIndex(seg => seg === 'sshift-gpt-bucket');
      console.log('Bucket index:', bucketIndex);
      if (bucketIndex < 0 || bucketIndex === segments.length - 1) {
        throw new Error('Cannot extract filename');
      }
      filename = segments.slice(bucketIndex + 1).join('/');
      console.log('Extracted filename:', filename);
    } catch (err) {
      console.error('Error extracting filename', err);
      return;
    }

    // Get the base URL from the backend service
    const baseUrl = backend.defaults.baseURL;
    if (!baseUrl) {
      console.error('Backend API URL is not defined');
      alert('Server configuration error. Please contact support.');
      return;
    }

    // Construct the full API URL, ensuring no double slashes
    const apiUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    // Remove /chat-api since it's already in the baseUrl, and ensure we're using the correct bucket route
    const downloadUrl = `${apiUrl}/bucket/download/${encodeURIComponent(filename)}`;
    console.log('Download URL:', downloadUrl);

    try {
      console.log('Initiating download request...');

      let token = jwt;
      console.log('Token from AuthContext:', token ? 'Token exists' : 'No token found in context');

      if (!token) {
        const stored = window.localStorage.getItem('jwt');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              // if walletAddress is available, try to find token for that account
              if (walletAddress) {
                const userTokenObj = parsed.find((entry: { account: string; token: string; }) => entry.account === walletAddress);
                if (userTokenObj) {
                  token = userTokenObj.token;
                }
              }
              // Fallback to the first token in the array if none found for this wallet
              if (!token && parsed.length > 0) {
                token = parsed[0].token;
              }
            }
          } catch (err) {
            console.error('Error parsing token from localStorage:', err);
          }
        }
      }

      console.log('Final token being used:', token ? 'Token exists' : 'No token found');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', errorText);
        throw new Error(`Download failed: ${response.status} ${errorText}`);
      }
      
      const blob = await response.blob();
      console.log('Blob received:', blob.type, blob.size);

      if ('showSaveFilePicker' in window) {
        console.log('Using File System Access API');
        const options = {
          suggestedName: filename.split('/').pop(),
          types: [
            {
              description: 'Image file',
              accept: { 'image/png': ['.png'] },
            },
          ],
        };
        try {
          // @ts-ignore: showSaveFilePicker may not be defined in all TS environments
          const handle = await window.showSaveFilePicker(options);
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.log('File saved successfully using File System Access API');
        } catch (err: any) {
          // Check if this is a user abort error (user canceled the save dialog)
          if (err.name === 'AbortError' || err.message.includes('user aborted')) {
            console.log('User canceled the save dialog');
            return; // Exit gracefully without showing an error
          }
          
          console.error('Error using File System Access API:', err);
          // Fallback to traditional download if there was a different error
          console.log('Falling back to traditional download method');
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename.split('/').pop() || 'edited-image.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } else {
        console.log('Using traditional download method');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.split('/').pop() || 'edited-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log('Traditional download initiated');
      }
    } catch (error) {
      // Check if this is a user abort error (user canceled the save dialog)
      if (error instanceof Error && 
          (error.name === 'AbortError' || error.message.includes('user aborted') || error.message.includes('cancel'))) {
        console.log('User canceled the download');
        return; // Exit gracefully without showing an error
      }
      
      console.error('Error during download:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Image</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative w-full" style={{ maxHeight: '70vh' }}>
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-150"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-300"></div>
                    <span className="text-gray-700 font-medium">Processing image...</span>
                  </div>
                </div>
              </div>
            )}
            <img
              ref={imageRef}
              src={showOriginal ? imageUrl : (editedImageUrl || imageUrl)}
              alt="Edit"
              className="w-full h-auto"
              style={{ opacity: previewMask ? 0.5 : 1 }}
            />
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="absolute top-0 left-0 w-full h-full"
              style={{
                background: 'transparent',
                pointerEvents: imageLoaded && !isProcessing ? 'auto' : 'none',
                cursor: brushMode === BrushMode.PAINT ? 'crosshair' : 'cell',
                display: showOriginal ? 'block' : 'none'
              }}
            />
          </div>

          {editedImageUrl && (
            <div className="flex justify-center gap-3">
              <button
                onClick={toggleImage}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                {showOriginal ? 'Show Edited Image' : 'Show Original Image'}
              </button>
              {!showOriginal && (
                <button
                  onClick={downloadEditedImage}
                  className="px-4 py-2 bg-blue-100 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Edited Image
                </button>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelType)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing || !showOriginal}
              >
                <option value={ModelType.V_2}>V2</option>
                <option value={ModelType.V_2_TURBO}>V2 Turbo</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your edit prompt..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing || !showOriginal}
              />
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brush Size: {brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isProcessing || !showOriginal}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setBrushMode(BrushMode.PAINT)}
                className={`p-2 rounded-md flex items-center gap-2 ${
                  brushMode === BrushMode.PAINT
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
                disabled={isProcessing || !showOriginal}
              >
                <Paintbrush className="h-5 w-5" />
                Paint
              </button>
              <button
                onClick={() => setBrushMode(BrushMode.ERASE)}
                className={`p-2 rounded-md flex items-center gap-2 ${
                  brushMode === BrushMode.ERASE
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
                disabled={isProcessing || !showOriginal}
              >
                <Eraser className="h-5 w-5" />
                Erase
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={clearMask}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isProcessing || !showOriginal}
            >
              Clear Mask
            </button>
            <button
              onClick={togglePreviewMask}
              className={`px-4 py-2 border ${previewMask ? 'bg-blue-100 border-blue-300' : 'border-gray-300'} rounded-md hover:bg-gray-50 transition-colors`}
              disabled={isProcessing || !showOriginal}
            >
              {previewMask ? 'Hide Mask' : 'Preview Mask'}
            </button>
            <button
              onClick={handleSendEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={isProcessing || !showOriginal}
            >
              {isProcessing ? 'Processing...' : 'Send Edit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 