import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Response from /api/images/check
export interface CheckImageResponse {
  status: 'found' | 'not_found';
  placeName?: string;
  imageId?: string;
  url?: string;
  description?: string;
  message?: string;
  fileType?: string;
  iconBase64?: string;
}

export interface ImageByUrlResponse {
  placeName: string;
  description?: string;
  fileType: string;
  size: number;
  imageBase64: string;
  iconBase64?: string;
}

export const checkImage = async (file: File): Promise<CheckImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_BASE_URL}/api/images/check`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data as CheckImageResponse;
};

export const uploadImageWithUrl = async (file: File, placeName: string, url: string): Promise<ImageData> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('placeName', placeName);
  formData.append('url', url);

  const response = await axios.post(`${API_BASE_URL}/api/images/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getImage = async (id: string): Promise<string> => {
  const response = await axios.get(`${API_BASE_URL}/api/images/${id}`, {
    responseType: 'arraybuffer',
  });
  
  const base64 = btoa(
    new Uint8Array(response.data).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );
  
  return `data:${response.headers['content-type']};base64,${base64}`;
};

export const getImageByUrl = async (url: string): Promise<ImageByUrlResponse> => {
  const response = await axios.get(`${API_BASE_URL}/api/images/by-url`, { params: { url } });
  return response.data as ImageByUrlResponse;
};
