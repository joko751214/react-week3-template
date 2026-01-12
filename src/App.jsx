import { useState, useEffect } from 'react';
import './app.css';
import { login, checkLogin } from './api/server/login';
import { getProducts } from './api/server/product';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const token = document.cookie.replace(/(?:(?:^|.*;\s*)hexschoolToken\s*\=\s*([^;]*).*$)|^.*$/, '$1');

  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleCheckLogin = async () => {
    try {
      setIsLoading(true);
      await checkLogin();
      setIsAuth(true);
    } catch (err) {
      setIsAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleCheckLogin();
    }
  }, []);

  const [products, setProducts] = useState([]);
  const handleGetProducts = async () => {
    const { data } = await getProducts();
    setProducts(data.products);
  };

  useEffect(() => {
    if (isAuth) {
      handleGetProducts();
    }
  }, [isAuth]);

  const [tempProduct, setTempProduct] = useState(null);

  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [messageSignIn, setMessageSignIn] = useState('');
  const [isErrorSignIn, setIsErrorSignIn] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsBtnLoading(true);
    try {
      const {
        data: { token, expired },
      } = await login(formData);
      setMessageSignIn('登入成功');
      setIsErrorSignIn(false);
      setTimeout(() => {
        setIsAuth(true);
      }, 1000);
      if (token) {
        document.cookie = `hexschoolToken=${token}; expires=${new Date(expired)};`;
      }
    } catch (error) {
      setIsAuth(false);
      setIsErrorSignIn(true);
      setMessageSignIn(error.response?.data?.message || '未知錯誤');
    } finally {
      setIsBtnLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { id, value } = event.target;
    setFormData({ ...formData, [id]: value });
  };

  return (
    <>
      {isLoading ? (
        <div className="spinner-container">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : isAuth ? (
        <div className="container">
          <div className="row mt-5">
            <div className="col-md-6">
              <h2>產品列表</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>產品名稱</th>
                    <th>原價</th>
                    <th>售價</th>
                    <th>是否啟用</th>
                    <th>查看細節</th>
                  </tr>
                </thead>
                <tbody>
                  {products && products.length > 0 ? (
                    products.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.origin_price}</td>
                        <td>{item.price}</td>
                        <td>{item.is_enabled ? '啟用' : '未啟用'}</td>
                        <td>
                          <button className="btn btn-primary" onClick={() => setTempProduct(item)}>
                            查看細節
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">尚無產品資料</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h2>單一產品細節</h2>
              {tempProduct ? (
                <div className="card mb-3">
                  <img src={tempProduct.imageUrl} className="card-img-top primary-image" alt="主圖" />
                  <div className="card-body">
                    <h5 className="card-title">
                      {tempProduct.title}
                      <span className="badge bg-primary ms-2">{tempProduct.category}</span>
                    </h5>
                    <p className="card-text">商品描述：{tempProduct.description}</p>
                    <p className="card-text">商品內容：{tempProduct.content}</p>
                    <div className="d-flex">
                      <p className="card-text text-secondary">
                        <del>{tempProduct.origin_price}</del>
                      </p>
                      元 / {tempProduct.price} 元
                    </div>
                    <h5 className="mt-3">更多圖片：</h5>
                    <div className="row flex-wrap gy-4">
                      {tempProduct.imagesUrl?.map((url, index) => (
                        <div className="col-6" key={index}>
                          <img src={url} className="images" alt="副圖" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-secondary">請選擇一個商品查看</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="container login">
          <div className="row justify-content-center">
            <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
            <div className="col-8">
              <form id="form" className="form-signin" onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="username"
                    placeholder="name@example.com"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                  <label htmlFor="username">Email address</label>
                </div>
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="password">Password</label>
                </div>
                <button className="btn btn-lg btn-primary w-100 mt-3" type="submit" disabled={isBtnLoading}>
                  {isBtnLoading ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <span>登入</span>
                  )}
                </button>
                {messageSignIn && (
                  <div className={`alert ${isErrorSignIn ? 'alert-danger' : 'alert-success'} mt-2 mb-0 p-2`} role="alert">
                    <div className={`${isErrorSignIn ? 'text-danger' : 'text-success'}`}>{messageSignIn}</div>
                  </div>
                )}
              </form>
            </div>
          </div>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
    </>
  );
}

export default App;
