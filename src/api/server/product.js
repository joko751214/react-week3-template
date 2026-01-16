import request from '../axios';

const path = import.meta.env.VITE_API_PATH;

// 取得產品列表
export function getProducts() {
  return request({
    url: `/api/${path}/admin/products`,
    method: 'get',
  });
}

// 新增產品
export function addProduct(data) {
  return request({
    url: `/api/${path}/admin/product`,
    method: 'post',
    data: {data},
  });
}

// 刪除產品
export function deleteProduct(id) {
  return request({
    url: `/api/${path}/admin/product/${id}`,
    method: 'delete',
  });
}

// 編輯產品
export function editProduct(data) {
  return request({
    url: `/api/${path}/admin/product/${data.id}`,
    method: 'put',
    data: {data},
  });
}