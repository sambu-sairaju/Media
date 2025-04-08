import { apiRequest } from './queryClient';

// API endpoints for Videos
export const videoApi = {
  fetchAll: async () => {
    const response = await fetch('/api/videos');
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
  },
  
  fetchById: async (id: number) => {
    const response = await fetch(`/api/videos/${id}`);
    if (!response.ok) throw new Error('Failed to fetch video');
    return response.json();
  },
  
  upload: async (file: File, metadata: any) => {
    const formData = new FormData();
    formData.append('video', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    
    const response = await fetch('/api/videos', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to upload video');
    return response.json();
  },
  
  // Stream video - handled directly via video src attribute
  // Delete video endpoint
  delete: async (id: number) => {
    return apiRequest('DELETE', `/api/videos/${id}`);
  }
};

// API endpoints for PDFs
export const pdfApi = {
  fetchAll: async () => {
    const response = await fetch('/api/pdfs');
    if (!response.ok) throw new Error('Failed to fetch PDFs');
    return response.json();
  },
  
  fetchById: async (id: number) => {
    const response = await fetch(`/api/pdfs/${id}`);
    if (!response.ok) throw new Error('Failed to fetch PDF');
    return response.json();
  },
  
  upload: async (file: File, metadata: any) => {
    const formData = new FormData();
    formData.append('pdf', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    
    const response = await fetch('/api/pdfs', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to upload PDF');
    return response.json();
  },
  
  // Download and view endpoints are handled via direct URLs
  delete: async (id: number) => {
    return apiRequest('DELETE', `/api/pdfs/${id}`);
  }
};

// API endpoints for Audio Recordings
export const audioApi = {
  fetchAll: async () => {
    const response = await fetch('/api/audio-recordings');
    if (!response.ok) throw new Error('Failed to fetch audio recordings');
    return response.json();
  },
  
  fetchById: async (id: number) => {
    const response = await fetch(`/api/audio-recordings/${id}`);
    if (!response.ok) throw new Error('Failed to fetch audio recording');
    return response.json();
  },
  
  upload: async (blob: Blob, name: string, duration: number) => {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('name', name);
    formData.append('duration', String(duration));
    
    const response = await fetch('/api/audio-recordings', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to upload audio recording');
    return response.json();
  },
  
  rename: async (id: number, name: string) => {
    return apiRequest('PATCH', `/api/audio-recordings/${id}`, { name });
  },
  
  delete: async (id: number) => {
    return apiRequest('DELETE', `/api/audio-recordings/${id}`);
  }
};

// API endpoints for WebGL
export const webglApi = {
  fetchAll: async () => {
    const response = await fetch('/api/webgl');
    if (!response.ok) throw new Error('Failed to fetch WebGL models');
    return response.json();
  },
  
  fetchById: async (id: number) => {
    const response = await fetch(`/api/webgl/${id}`);
    if (!response.ok) throw new Error('Failed to fetch WebGL model');
    return response.json();
  },
  
  upload: async (file: File, metadata: any) => {
    const formData = new FormData();
    formData.append('webgl', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    
    const response = await fetch('/api/webgl', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to upload WebGL model');
    return response.json();
  },
  
  delete: async (id: number) => {
    return apiRequest('DELETE', `/api/webgl/${id}`);
  }
};
