import { useState, useEffect, useRef } from 'react';
import './App.css';
import { login, checkLogin } from './api/server/login';
import { getProducts, addProduct, deleteProduct, editProduct } from './api/server/product';
import { Modal, Toast } from 'bootstrap';

function App() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const token = document.cookie.replace(/(?:(?:^|.*;\s*)hexschoolToken\s*\=\s*([^;]*).*$)|^.*$/, '$1');

  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // 檢查是否為管理員
  const checkAdmin = async () => {
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


  const [products, setProducts] = useState([]);
  // 取得產品列表
  const handleGetProducts = async () => {
    const { data } = await getProducts();
    setProducts(data.products);
  };

  useEffect(() => {
    if (isAuth) {
      handleGetProducts();
    }
  }, [isAuth]);

  // 按鈕載入中狀態
  const [btnLoading, setBtnLoading] = useState({});
  const withBtnLoading = async (key, callback) => {
    setBtnLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await callback();
    } finally {
      setBtnLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const [messageSignIn, setMessageSignIn] = useState('');
  const [isErrorSignIn, setIsErrorSignIn] = useState(false);
  // 登入表單提交
  const handleSubmit = async (event) => {
    event.preventDefault();
    await withBtnLoading('login', async () => {
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
      }
    })
  }

  // 登入表單輸入變更
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const originProduct = {
    title: '',
    category: '',
    origin_price: '',
    price: '',
    unit: '',
    description: '',
    content: '',
    is_enabled: 0,
    imageUrl: '',
    imagesUrl: [],
  };
  const [product, setProduct] = useState({...originProduct});
  const handleSetProduct = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = value;
    // number 轉成數字
    if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    }

    // checkbox 處理
    if (type === 'checkbox') {
      newValue = checked ? 1 : 0;
    }
    setProduct({ ...product, [name]: newValue });
  }

  const productModalRef = useRef(null);
  const openModal = () => {
    productModalRef.current.show();
    setProduct({...originProduct});
    setIsEditing(false);
    console.log('isEditing', isEditing);
  }

  const toastRef = useRef(null);
  useEffect(() => {
    productModalRef.current = new Modal(productModalRef.current);
    toastRef.current = new Toast(toastRef.current);
    if (token) {
      checkAdmin();
    }
  }, []);

  const [toastMesage, setToastMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  // 新增或編輯產品
  const handleProductAction = async (type) => {
    await withBtnLoading('productAction', async () => {
      try {
        isEditing ? await editProduct(product) : await addProduct(product);
        const message = isEditing ? '編輯成功' : '新增成功';
        setToastMessage(message);
        toastRef.current.show();
        setTimeout(() => {
          productModalRef.current.hide();
          handleGetProducts();
        }, 500);
      } catch(err) {
        console.error(err);
      }})};

  // 編輯產品
  const handleEditProduct = async (data) => {
    setProduct({...data});
    setIsEditing(true);
    productModalRef.current.show();
  };

  // 刪除產品
  const handleDeleteProduct = async (id) => {
    await withBtnLoading(`delete_${id}`, async () => {
    try {
      await deleteProduct(id);
      setToastMessage('刪除成功');
      toastRef.current.show();
      handleGetProducts();
    } catch(err) {
      console.error(err);
    }
  })};

  return (
    <>
      {isLoading ? (
        <div className="spinner-container">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : isAuth ? (
        <div>
          <div className="container">
            <div className="text-end mt-4">
              <button type="button" className="btn btn-primary" onClick={() => openModal()}>建立新的產品</button>
            </div>
            <table className="table mt-4">
              <thead>
                <tr>
                  <th width="120">分類</th>
                  <th>產品名稱</th>
                  <th width="120">原價</th>
                  <th width="120">售價</th>
                  <th width="100">是否啟用</th>
                  <th width="150">編輯</th>
                </tr>
              </thead>
              <tbody>
                {products && products.length > 0 ? products.map((product) => (
                <tr key={product.id}>
                  <td>{product.category}</td>
                  <td>{product.title}</td>
                  <td className="text-center">{product.origin_price}</td>
                  <td className="text-center">{product.price}</td>
                  <td>
                    {product.is_enabled ? (
                    <span className="text-success">啟用</span>
                    ) : (
                    <span>未啟用</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleEditProduct(product)} disabled={btnLoading[`delete_${product.id}`]}>
                        編輯
                      </button>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteProduct(product.id)} disabled={btnLoading[`delete_${product.id}`]}>
                        {btnLoading[`delete_${product.id}`] && (
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        )}
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
                )): (
                <tr>
                  <td colSpan="5">尚無產品資料</td>
                </tr>
                )}
              </tbody>
            </table>
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
                    name="username"
                    type="email"
                    className="form-control"
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
                    name="password"
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="password">Password</label>
                </div>
                <button className="btn btn-lg btn-primary w-100 mt-3" type="submit" disabled={btnLoading.login}>
                  {btnLoading.login && (
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  )}
                  <span>登入</span>
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
      {/* 新增產品 Modal */}
      <div
        ref={productModalRef}
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header bg-dark text-white">
              <h5 className="modal-title">
                <span>新增產品</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-sm-4">
                  <div className="mb-2">
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">
                        輸入圖片網址
                      </label>
                      <input
                        id="imageUrl"
                        name="imageUrl"
                        type="text"
                        value={product.imageUrl}
                        className="form-control"
                        placeholder="請輸入圖片連結"
                        onChange={handleSetProduct}
                        />
                    </div>
                    <img className="img-fluid" src={product.imageUrl} alt="主圖" />
                  </div>
                  <div>
                    <button className="btn btn-outline-primary btn-sm d-block w-100">
                      新增圖片
                    </button>
                  </div>
                  <div>
                    <button className="btn btn-outline-danger btn-sm d-block w-100">
                      刪除圖片
                    </button>
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">標題</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={product.title}
                      className="form-control"
                      placeholder="請輸入標題"
                      onChange={handleSetProduct}
                      />
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="category" className="form-label">分類</label>
                      <input
                        id="category"
                        name="category"
                        type="text"
                        value={product.category}
                        className="form-control"
                        placeholder="請輸入分類"
                        onChange={handleSetProduct}
                        />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="unit" className="form-label">單位</label>
                      <input
                        id="unit"
                        name="unit"
                        type="text"
                        value={product.unit}
                        className="form-control"
                        placeholder="請輸入單位"
                        onChange={handleSetProduct}
                        />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="origin_price" className="form-label">原價</label>
                      <input
                        id="origin_price"
                        name="origin_price"
                        type="number"
                        min="0"
                        value={product.origin_price}
                        className="form-control"
                        placeholder="請輸入原價"
                        onChange={handleSetProduct}
                        />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="price" className="form-label">售價</label>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        value={product.price}
                        className="form-control"
                        placeholder="請輸入售價"
                        onChange={handleSetProduct}
                        />
                    </div>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">產品描述</label>
                    <textarea
                      id="description"
                      name="description"
                      value={product.description}
                      className="form-control"
                      placeholder="請輸入產品描述"
                      onChange={handleSetProduct}
                      ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">說明內容</label>
                    <textarea
                      id="content"
                      name="content"
                      value={product.content}
                      className="form-control"
                      placeholder="請輸入說明內容"
                      onChange={handleSetProduct}
                      ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        id="is_enabled"
                        name="is_enabled"
                        className="form-check-input"
                        type="checkbox"
                        checked={product.is_enabled}
                        onChange={handleSetProduct}
                        />
                      <label className="form-check-label" htmlFor="is_enabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
                disabled={btnLoading.productAction}
                >
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={() => handleProductAction()} disabled={btnLoading.productAction}>
                {btnLoading.productAction && (
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                )}
                <span>確認</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* toast */}
      <div ref={toastRef} className="toast position-fixed top-10 end-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div className="toast-body alert alert-success mb-0">{toastMesage}</div>
      </div>
    </>
  );
}

export default App;
