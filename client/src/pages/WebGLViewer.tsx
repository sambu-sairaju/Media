import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import WebGLRenderer from "../components/webgl/WebGLRenderer";
import WebGLControls from "../components/webgl/WebGLControls";

const backgrounds = [
  { value: "black", class: "bg-gray-900" },
  { value: "white", class: "bg-white" },
  { value: "blue", class: "bg-blue-900" },
  { value: "gradient", class: "bg-gradient-to-b from-blue-500 to-purple-600" },
];

const WebGLViewer = () => {
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [quality, setQuality] = useState("high");
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const [backgroundColor, setBackgroundColor] = useState("black");
  const [lighting, setLighting] = useState("natural");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: webglModels, isLoading: loadingModels } = useQuery({
    queryKey: ['/api/webgl'],
    staleTime: 60000, // 1 minute
  });

  const { data: selectedModel, isLoading: loadingSelectedModel } = useQuery({
    queryKey: ['/api/webgl', selectedModelId],
    enabled: !!selectedModelId,
  });

  // Select first model by default when models are loaded
  useEffect(() => {
    if (webglModels?.length && !selectedModelId) {
      setSelectedModelId(webglModels[0].id);
    }
  }, [webglModels, selectedModelId]);

  const handleReset = () => {
    // Reset camera position and rotation
  };

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-medium text-gray-800 dark:text-white">WebGL Viewer</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Explore 3D models and WebGL content</p>
      </header>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {loadingSelectedModel ? (
            <Skeleton className="h-6 w-60" />
          ) : (
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">{selectedModel?.name || "No model selected"}</h2>
          )}
          
          <WebGLControls 
            onFullscreen={() => setIsFullscreen(!isFullscreen)} 
            onReset={handleReset} 
          />
        </div>
        
        <div className={`aspect-video w-full bg-black ${isFullscreen ? 'fixed inset-0 z-50 h-full' : ''}`}>
          <WebGLRenderer 
            modelUrl={selectedModel ? `/api/webgl/${selectedModel.id}/render` : undefined}
            backgroundColor={backgroundColor}
            quality={quality}
            animationSpeed={animationSpeed / 100}
            lighting={lighting}
            isLoading={loadingSelectedModel}
            isFullscreen={isFullscreen}
            onExitFullscreen={() => setIsFullscreen(false)}
          />
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700">
            <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">Model Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loadingSelectedModel ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n}>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            ) : selectedModel ? (
              <dl className="grid grid-cols-1 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{selectedModel.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{Math.round(selectedModel.size / (1024 * 1024) * 10) / 10} MB</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Format</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{selectedModel.format}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                    {new Date(selectedModel.dateUploaded).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No model selected</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700">
            <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">WebGL Controls</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rendering Quality</Label>
                <select 
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded py-2 px-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Animation Speed</Label>
                <Slider 
                  value={[animationSpeed]} 
                  min={0} 
                  max={100} 
                  step={1}
                  onValueChange={(value) => setAnimationSpeed(value[0])}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Color</Label>
                <div className="flex space-x-2">
                  {backgrounds.map((bg) => (
                    <button
                      key={bg.value}
                      className={`w-8 h-8 ${bg.class} rounded-full border-2 ${
                        backgroundColor === bg.value ? 'border-white' : 'border-transparent'
                      }`}
                      onClick={() => setBackgroundColor(bg.value)}
                      aria-label={`Set background to ${bg.value}`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lighting</Label>
                <RadioGroup 
                  value={lighting} 
                  onValueChange={setLighting}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="natural" id="lighting-natural" />
                    <Label htmlFor="lighting-natural" className="text-sm text-gray-700 dark:text-gray-300">Natural</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="studio" id="lighting-studio" />
                    <Label htmlFor="lighting-studio" className="text-sm text-gray-700 dark:text-gray-300">Studio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dramatic" id="lighting-dramatic" />
                    <Label htmlFor="lighting-dramatic" className="text-sm text-gray-700 dark:text-gray-300">Dramatic</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WebGLViewer;
