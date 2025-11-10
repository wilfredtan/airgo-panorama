import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, EquirectangularReflectionMapping, BackSide, PerspectiveCamera, Mesh } from 'three';
import styled from 'styled-components';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  position: relative;
  width: 80vw;
  height: 80vh;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #c82333;
  }
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
`;

const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

function PanoramaSphere({ imageUrl }: { imageUrl: string }) {
  const meshRef = useRef<Mesh>(null);

  // Load the texture
  const texture = useLoader(TextureLoader, imageUrl);

  // Set texture properties for equirectangular mapping
  React.useEffect(() => {
    if (texture) {
      texture.mapping = EquirectangularReflectionMapping;
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial
        map={texture}
        side={BackSide}
      />
    </mesh>
  );
}

function CameraController() {
  const { camera, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });

  // Spherical coordinates
  const [theta, setTheta] = useState(0); // Horizontal angle (azimuthal)
  const [polar, setPolar] = useState(Math.PI / 2); // Vertical angle (polar, from Y axis)
  const [fov, setFov] = useState(75); // Field of view

  // Update camera position based on spherical coordinates
  const updateCameraPosition = () => {
    const clampedPolar = Math.max(0.1, Math.min(Math.PI - 0.1, polar)); // Prevent gimbal lock at poles
    (camera as PerspectiveCamera).fov = fov;
    camera.position.set(
      0.1 * Math.sin(clampedPolar) * Math.cos(theta),
      0.1 * Math.cos(clampedPolar),
      0.1 * Math.sin(clampedPolar) * Math.sin(theta)
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };

  // Update camera on coordinate changes
  React.useEffect(() => {
    updateCameraPosition();
  }, [theta, polar, fov]);

  const handleMouseDown = (event: MouseEvent) => {
    setIsDragging(true);
    setPreviousMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    // Update spherical angles
    const sensitivity = 0.005;
    setTheta(prev => prev - deltaX * sensitivity);
    setPolar(prev => prev + deltaY * sensitivity); // Note: + for natural up/down

    setPreviousMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const fovChange = 5;
    const direction = event.deltaY > 0 ? 1 : -1; // Positive deltaY = zoom out (widen FOV)
    setFov(prev => Math.max(30, Math.min(75, prev + direction * fovChange)));
  };

  React.useEffect(() => {
    const canvas = gl.domElement;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gl, isDragging, previousMousePosition]);

  return null;
}

interface PanoramaViewerProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({
  imageUrl,
  imageName,
  onClose
}) => {
  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>Panorama View: {imageName}</h3>
          <CloseButton onClick={onClose}>Close</CloseButton>
        </ModalHeader>
        <CanvasContainer>
          <Suspense fallback={<LoadingSpinner />}>
            <Canvas
              gl={{ antialias: true }}
            >
              <PanoramaSphere imageUrl={imageUrl} />
              <CameraController />
            </Canvas>
          </Suspense>
        </CanvasContainer>
      </ModalContent>
    </Modal>
  );
};

export default PanoramaViewer;
