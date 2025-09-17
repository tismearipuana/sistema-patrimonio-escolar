import axios from 'axios';

export const api = axios.create({
  // A URL base da sua API. Usaremos uma variável de ambiente para isso.
  baseURL: process.env.NEXT_PUBLIC_API_URL, 
});