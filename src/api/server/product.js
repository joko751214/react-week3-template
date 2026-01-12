import request from '../axios';

const path = import.meta.env.VITE_API_PATH;

export function getProducts() {
  return request({
    url: `api/${path}/admin/products`,
    method: 'get',
  });
}
