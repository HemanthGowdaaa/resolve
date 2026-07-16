import apiClient from "./api";

export const AuthService = {
  register: async (email, password, fullName) => {
    const response = await apiClient.post("/auth/register/", {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post("/auth/login/", {
      email,
      password,
    });
    return response.data;
  },

  googleLogin: async (idToken) => {
    const response = await apiClient.post("/auth/google/", {
      id_token: idToken,
    });
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await apiClient.post("/auth/logout/", {
      refresh: refreshToken,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get("/profile/");
    return response.data;
  },

  updateProfile: async (fullName, profilePicture) => {
    const response = await apiClient.put("/profile/", {
      full_name: fullName,
      profile_picture: profilePicture,
    });
    return response.data;
  }
};
export default AuthService;
