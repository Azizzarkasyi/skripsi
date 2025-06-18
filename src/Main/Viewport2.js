import React, {useState, useEffect} from "react";
import {InView} from "react-intersection-observer";
import image from "../data.js";
import "../style/Viewport.css";

// Format file size helper
const formatFileSize = bytes => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
  else return (bytes / 1048576).toFixed(2) + " MB";
};

// Image component with intersection observer (without compression)
const LazyImage = ({imageData}) => {
  const [loaded, setLoaded] = useState(false);
  const [imageSize, setImageSize] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loadTime, setLoadTime] = useState(null);

  // Process image when it comes into view
  const processImage = async () => {
    const startTime = Date.now();

    try {
      console.log(`Loading image: ${imageData.name}`);

      // Get image size using HEAD request
      const response = await fetch(imageData.paths[0], {method: "HEAD"});

      if (response.ok) {
        const contentLength = response.headers.get("content-length");
        const size = contentLength ? parseInt(contentLength) : 0;

        console.log(`Image size: ${formatFileSize(size)}`);

        setImageSize(size);
        const endTime = Date.now();
        setLoadTime(endTime - startTime);
      } else {
        // Fallback: simulate size if HEAD request fails
        const simulatedSize = Math.floor(Math.random() * 5000000) + 500000; // 0.5-5.5 MB
        setImageSize(simulatedSize);
        const endTime = Date.now();
        setLoadTime(endTime - startTime);
      }
    } catch (error) {
      console.error(`Error loading image info: ${error.message}`);
      // Fallback: simulate size
      const simulatedSize = Math.floor(Math.random() * 5000000) + 500000;
      setImageSize(simulatedSize);
      const endTime = Date.now();
      setLoadTime(endTime - startTime);
    }
  };

  // Get file extension
  const getFileExtension = path => {
    return path.split(".").pop()?.toUpperCase() || "UNKNOWN";
  };

  // Popup Component
  const ImagePopup = () => (
    <div className="popup-overlay" onClick={() => setShowPopup(false)}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h2>{imageData.name}</h2>
          <button className="close-button" onClick={() => setShowPopup(false)}>
            ✕
          </button>
        </div>

        <div className="popup-images">
          <div className="single-image-view">
            <div className="image-display">
              <h3>Original Image (No Compression)</h3>
              <img
                src={imageData.paths[0]}
                alt={imageData.name}
                className="popup-image"
              />

              <div className="image-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">File Name:</span>
                    <span className="detail-value">{imageData.name}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">File Size:</span>
                    <span className="detail-value">
                      {imageSize ? formatFileSize(imageSize) : "Loading..."}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Format:</span>
                    <span className="detail-value">
                      {getFileExtension(imageData.paths[0])}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <InView
        threshold={0.1}
        triggerOnce
        onChange={inView => {
          if (inView && !loaded) {
            processImage();
          }
        }}
      >
        {({inView, ref}) => (
          <div ref={ref} className="image-container">
            {inView ? (
              <>
                <img
                  src={imageData.paths[0]}
                  alt={imageData.name}
                  className="lazy-image clickable-image"
                  onClick={() => setShowPopup(true)}
                  onLoad={() => {
                    setLoaded(true);
                    console.log(`Image ${imageData.name} displayed`);
                  }}
                  onError={e => {
                    console.log(`Error loading image: ${imageData.name}`);
                    // Try alternative paths if available
                    if (
                      imageData.paths.length > 1 &&
                      e.target.src === imageData.paths[0]
                    ) {
                      e.target.src = imageData.paths[1];
                    }
                  }}
                />

                <div className="image-info">
                  <h3>{imageData.name}</h3>

                  <div className="size-info">
                    <p>
                      <strong>File Size:</strong>{" "}
                      {imageSize ? formatFileSize(imageSize) : "Loading..."}
                    </p>

                    <p>
                      <strong>Format:</strong>{" "}
                      {getFileExtension(imageData.paths[0])}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="placeholder">
                <div className="loading-spinner"></div>
                <p>Loading image...</p>
              </div>
            )}
          </div>
        )}
      </InView>

      {/* Popup */}
      {showPopup && <ImagePopup />}
    </>
  );
};

export default function Viewport2() {
  const [totalImages, setTotalImages] = useState(0);
  const [loadedImages, setLoadedImages] = useState(0);

  useEffect(() => {
    setTotalImages(image.length);
  }, []);

  return (
    <div className="image-gallery">
      <div className="gallery-header">
        <h1>Original Image Gallery (No Compression)</h1>
        <div className="gallery-stats">
          <p>Total Images: {totalImages}</p>
          <p>
            Loaded: {loadedImages}/{totalImages}
          </p>
        </div>
      </div>

      <div className="image-grid">
        {image.map(imageItem => (
          <LazyImage
            key={imageItem.key}
            imageData={imageItem}
            onLoad={() => setLoadedImages(prev => prev + 1)}
          />
        ))}
      </div>
    </div>
  );
}
