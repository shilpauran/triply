import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export const createWishlist = async (name: string) => {
  const response = await axios.post(`${API_BASE_URL}/wishlists`, { name });
  return response.data;
};

export const getAllWishlists = async () => {
  const response = await axios.get(`${API_BASE_URL}/wishlists`);
  return response.data;
};

export const addToWishlist = async (
  wishlistName: string,
  placeName: string,
  imageUrl?: string,
  description?: string,
  imageBase64?: string,
  imageType?: string,
) => {
  const payload: any = { placeName };
  if (imageUrl) payload.imageUrl = imageUrl;
  if (description) payload.description = description;
  if (imageBase64) payload.imageBase64 = imageBase64;
  if (imageType) payload.imageType = imageType;
  const response = await axios.post(
    `${API_BASE_URL}/wishlists/${encodeURIComponent(wishlistName)}/places`,
    payload
  );
  return response.data;
};

export const getWishlist = async (name: string) => {
  const response = await axios.get(`${API_BASE_URL}/wishlists/${encodeURIComponent(name)}`);
  return response.data;
};

export interface WishlistItemDetail {
  placeName: string;
  imageUrl?: string;
  description?: string;
  imageBase64?: string;
  imageType?: string;
}

export const getWishlistDetails = async (name: string): Promise<WishlistItemDetail[]> => {
  const response = await axios.get(`${API_BASE_URL}/wishlists/${encodeURIComponent(name)}/details`);
  return response.data as WishlistItemDetail[];
};

export const deleteWishlist = async (name: string) => {
  const response = await axios.delete(`${API_BASE_URL}/wishlists/${encodeURIComponent(name)}`);
  return response.data;
};

export const removeFromWishlist = async (wishlistName: string, placeName: string) => {
  const response = await axios.delete(
    `${API_BASE_URL}/wishlists/${encodeURIComponent(wishlistName)}/places/${encodeURIComponent(placeName)}`
  );
  return response.data;
};
