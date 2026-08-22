import { customFetch } from './fetchClient';


export const login = async (email,password) => {
  return await customFetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({email, password}),
  });
};

export const register = async (formdata) => {
  return await customFetch('/login/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formdata),
  });
};