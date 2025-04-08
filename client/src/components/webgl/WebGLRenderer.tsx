import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface WebGLRendererProps {
  modelUrl?: string;
  backgroundColor: string;
  quality: string;
  animationSpeed: number;
  lighting: string;
  isLoading: boolean;
  isFullscreen: boolean;
  onExitFullscreen: () => void;
}

const WebGLRenderer: React.FC<WebGLRendererProps> = ({
  modelUrl,
  backgroundColor,
  quality,
  animationSpeed,
  lighting,
  isLoading,
  isFullscreen,
  onExitFullscreen
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);
  
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: quality !== 'low',
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    
    // Set background color
    updateBackgroundColor(backgroundColor);

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Append renderer to DOM
    containerRef.current.appendChild(renderer.domElement);

    // Setup lighting
    setupLighting(lighting);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (animationMixerRef.current) {
        animationMixerRef.current.update(0.016 * animationSpeed); // 60fps * speed
      }
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Handle fullscreen escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        onExitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      rendererRef.current?.dispose();
    };
  }, [isFullscreen, onExitFullscreen]);

  // Update renderer quality
  useEffect(() => {
    if (!rendererRef.current) return;
    
    switch (quality) {
      case 'low':
        rendererRef.current.setPixelRatio(1);
        rendererRef.current.shadowMap.enabled = false;
        break;
      case 'medium':
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        rendererRef.current.shadowMap.enabled = true;
        rendererRef.current.shadowMap.type = THREE.PCFShadowMap;
        break;
      case 'high':
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current.shadowMap.enabled = true;
        rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
      case 'ultra':
        rendererRef.current.setPixelRatio(window.devicePixelRatio);
        rendererRef.current.shadowMap.enabled = true;
        rendererRef.current.shadowMap.type = THREE.VSMShadowMap;
        break;
    }
  }, [quality]);

  // Setup lighting based on selected option
  const setupLighting = (lightingType: string) => {
    if (!sceneRef.current) return;
    
    // Remove existing lights
    lightsRef.current.forEach(light => {
      sceneRef.current?.remove(light);
    });
    lightsRef.current = [];
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    lightsRef.current.push(ambientLight);
    
    switch (lightingType) {
      case 'natural': {
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7.5);
        dirLight.castShadow = true;
        sceneRef.current.add(dirLight);
        lightsRef.current.push(dirLight);
        
        const fillLight = new THREE.DirectionalLight(0x9090ff, 0.3);
        fillLight.position.set(-5, 2, -7.5);
        sceneRef.current.add(fillLight);
        lightsRef.current.push(fillLight);
        break;
      }
      case 'studio': {
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
        keyLight.position.set(0, 5, 5);
        keyLight.castShadow = true;
        sceneRef.current.add(keyLight);
        lightsRef.current.push(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-5, 3, 0);
        sceneRef.current.add(fillLight);
        lightsRef.current.push(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(5, 2, -5);
        sceneRef.current.add(rimLight);
        lightsRef.current.push(rimLight);
        break;
      }
      case 'dramatic': {
        const spotLight = new THREE.SpotLight(0xff0000, 1);
        spotLight.position.set(5, 5, 5);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.3;
        spotLight.castShadow = true;
        sceneRef.current.add(spotLight);
        lightsRef.current.push(spotLight);
        
        const blueSpot = new THREE.SpotLight(0x0000ff, 1);
        blueSpot.position.set(-5, 3, -5);
        blueSpot.angle = Math.PI / 6;
        blueSpot.penumbra = 0.3;
        sceneRef.current.add(blueSpot);
        lightsRef.current.push(blueSpot);
        break;
      }
    }
  };

  // Update lighting when lighting option changes
  useEffect(() => {
    setupLighting(lighting);
  }, [lighting]);

  // Update background color
  const updateBackgroundColor = (color: string) => {
    if (!sceneRef.current || !rendererRef.current) return;
    
    switch (color) {
      case 'black':
        sceneRef.current.background = new THREE.Color('#121212');
        break;
      case 'white':
        sceneRef.current.background = new THREE.Color('#ffffff');
        break;
      case 'blue':
        sceneRef.current.background = new THREE.Color('#0a1b3d');
        break;
      case 'gradient':
        // For gradient, we need to use a shader background or CSS background
        sceneRef.current.background = null;
        rendererRef.current.domElement.style.background = 'linear-gradient(to bottom, #1a82ff, #7f3dff)';
        return;
      default:
        sceneRef.current.background = new THREE.Color('#121212');
    }
    
    // Clear any CSS background if not using gradient
    if (rendererRef.current) {
      rendererRef.current.domElement.style.background = '';
    }
  };

  // Update background when color changes
  useEffect(() => {
    updateBackgroundColor(backgroundColor);
  }, [backgroundColor]);

  // Load model when URL changes
  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return;
    
    setIsModelLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    const loader = new GLTFLoader();
    
    // Remove any existing models
    if (sceneRef.current) {
      const modelsToRemove: THREE.Object3D[] = [];
      sceneRef.current.traverse(object => {
        if (object instanceof THREE.Mesh) {
          modelsToRemove.push(object.parent || object);
        }
      });
      
      // Remove unique parent objects to avoid removing children multiple times
      const uniqueParents = [...new Set(modelsToRemove)];
      uniqueParents.forEach(object => {
        sceneRef.current?.remove(object);
      });
    }
    
    // Load new model
    loader.load(
      modelUrl,
      (gltf) => {
        if (sceneRef.current) {
          const model = gltf.scene;
          
          // Center model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.x = -center.x;
          model.position.y = -center.y;
          model.position.z = -center.z;
          
          // Adjust camera to fit model
          const size = box.getSize(new THREE.Vector3()).length();
          const distance = size / Math.tan(Math.PI * cameraRef.current!.fov / 360);
          cameraRef.current!.position.set(0, 0, distance * 1.2);
          cameraRef.current!.lookAt(0, 0, 0);
          
          sceneRef.current.add(model);
          
          // Handle animations
          if (gltf.animations.length) {
            animationMixerRef.current = new THREE.AnimationMixer(model);
            const animation = gltf.animations[0];
            const action = animationMixerRef.current.clipAction(animation);
            action.play();
          }
          
          setIsModelLoading(false);
        }
      },
      (progress) => {
        const percentage = (progress.loaded / progress.total) * 100;
        setLoadingProgress(percentage);
      },
      (error) => {
        console.error('Error loading model:', error);
        setError('Failed to load 3D model');
        setIsModelLoading(false);
      }
    );
    
    return () => {
      // Cleanup animation mixer
      if (animationMixerRef.current) {
        animationMixerRef.current = null;
      }
    };
  }, [modelUrl]);

  // Show loading state
  if (isLoading || isModelLoading) {
    return (
      <div ref={containerRef} className="w-full h-full bg-gray-800 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <span className="material-icons text-6xl animate-pulse">3d_rotation</span>
          {isModelLoading && (
            <div className="mt-4 w-48">
              <div className="h-2 bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs mt-2 text-center">{Math.round(loadingProgress)}% loaded</p>
            </div>
          )}
        </div>
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded">
          {isLoading ? 'Loading WebGL Content' : 'Loading 3D Model'}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div ref={containerRef} className="w-full h-full bg-gray-800 flex items-center justify-center">
        <div className="text-center text-red-500">
          <span className="material-icons text-4xl mb-2">error_outline</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Render WebGL container
  return (
    <div ref={containerRef} className="w-full h-full relative">
      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <span>No 3D model selected</span>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded">
        WebGL Content
      </div>
      
      <div className="absolute top-4 right-4 flex space-x-2">
        <button className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-2">
          <span className="material-icons">zoom_in</span>
        </button>
        <button className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-2">
          <span className="material-icons">zoom_out</span>
        </button>
        <button className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-2">
          <span className="material-icons">pan_tool</span>
        </button>
      </div>
      
      {isFullscreen && (
        <button 
          className="absolute top-4 left-4 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-2"
          onClick={onExitFullscreen}
        >
          <span className="material-icons">fullscreen_exit</span>
        </button>
      )}
    </div>
  );
};

export default WebGLRenderer;
