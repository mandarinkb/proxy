const axiosMiddleware = axios.create();

// Add a request interceptor
axiosMiddleware.interceptors.request.use(
  (config) => {
    // Do something before request is sent
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosMiddleware.interceptors.response.use(
  (res) => {
    return res;
  },
  (error) => {
    const originalRequest = error.config;
    console.log(originalRequest.url);
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      return axiosMiddleware
        .post("http://localhost:8080/v1/token/refresh", {
          refresh_token: localStorage.getItem("refreshToken"),
        })
        .then((response) => {
          if (response.status === 201) {
            localStorage.setItem(
              "accessToken",
              Object.values(response.data)[0]
            );
            localStorage.setItem(
              "refreshToken",
              Object.values(response.data)[1]
            );
            console.log("new token", response.data);


            return axiosMiddleware(originalRequest);
          }
        })
        .catch((error) => console.error(error));
    }
    return Promise.reject(error);
  }
);

// เข้าสู่ระบบ
const authenticate = () => {
  let data = JSON.stringify({ username: "joke", password: "joke" });
  let config = {
    method: "post",
    url: "http://localhost:8080/v1/authenticate",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axiosMiddleware(config)
    .then((res) => {
      document.getElementById("accessToken").value = Object.values(res.data)[0];
      document.getElementById("refreshToken").value = Object.values(res.data)[1];
      localStorage.setItem("accessToken", Object.values(res.data)[0]);
      localStorage.setItem("refreshToken", Object.values(res.data)[1]);

      document.getElementById("btn-logout").style.display = 'inline';
      document.getElementById("btn-get-user").style.display = 'inline';
    })
    .catch((error) => {
      console.log(error);
    });
};

// ดึงข้อมูลผู้ใช้งาน
const getUser = () => {
  let config = {
    method: "get",
    url: "http://127.0.0.1:8080/v1/users",
  };

  axiosMiddleware(config)
    .then((res) => {
      console.log(JSON.stringify(res.data));
    })
    .catch((error) => console.log(error));
};

const logout = () => {
  const token = localStorage.getItem("accessToken");
  let config = {
    method: 'post',
    url: 'http://localhost:8080/v1/logout',
    headers: { 
      'Authorization': `Bearer ${token}`
    }
  };
  
  axiosMiddleware(config)
  .then((res) => {
    console.log(JSON.stringify(res.data));
    localStorage.clear();
    document.getElementById("accessToken").value = '';
    document.getElementById("refreshToken").value = '';
 
    document.getElementById("btn-logout").style.display = 'none';
    document.getElementById("btn-get-user").style.display = 'none';
  })
  .catch((error) => {
    console.log(error);
  });
}
