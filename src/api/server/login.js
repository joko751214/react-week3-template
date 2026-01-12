import request from '../axios';

export function login(data) {
  return request({
    url: '/admin/signin',
    method: 'post',
    data,
  });
}

export function checkLogin() {
  return request({
    url: '/api/user/check',
    method: 'post',
  });
}
