import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export interface ImageData {
  id: string;
  placeName: string;
  type: string;
  data: string;
}

export const checkImage = async (file: File): Promise<ImageData> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_BASE_URL}/api/images/check`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const uploadImage = async (file: File, placeName: string): Promise<ImageData> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('placeName', placeName);
  
  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getImage = async (id: string): Promise<string> => {
  const response = await axios.get(`${API_BASE_URL}/${id}`, {
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
