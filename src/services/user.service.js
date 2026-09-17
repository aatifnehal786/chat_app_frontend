import axiosInstance from "./url.service";

export const sendMobileOtp = async (mobile) => {
  const { data } = await axiosInstance.post('/auth/send-mobile-otp', { mobile });
  return data;
};

export const verifyMobileOtp = async (mobile, otp) => {
  const { data } = await axiosInstance.post('/auth/verify-mobile-otp', { mobile, otp });
  return data;
};

export const sendEmailOtp = async (email, username) => {
  const { data } = await axiosInstance.post('/auth/send-email-otp', { email, username });
  return data;
};

export const verifyEmailOtp = async (email, otp) => {
  const { data } = await axiosInstance.post('/auth/verify-email-otp', { email, otp });
  return data;
};

export const checkUserAuth = async () => {
  try {
    const { data } = await axiosInstance.get("/auth/me");
    return { isAuthenticated: true, user: data };
  } catch {
    try {
      const { data } = await axiosInstance.get("/users/check-auth", { withCredentials: true });
      return { isAuthenticated: true, user: data.data || data };
    } catch {
      return { isAuthenticated: false, user: null };
    }
  }
};

export const logoutUser = async() => {
  const { data } = await axiosInstance.post('/auth/logout');
  return data;
};

export const getAllUsers = async() => {
  // your backend route: /users/other-users-list
  const { data } = await axiosInstance.get('/users/other-users-list');
  return data;
};

export const updateUserProfile = async(formData) => {
  // formData should have: fullName, gender, about, profilePic file
  // Route: PUT /users/setup-profile (or /update-profile)
  try {
    const { data } = await axiosInstance.put('/users/setup-profile', formData);
    return data;
  } catch {
    const { data } = await axiosInstance.put('/users/update-profile', formData);
    return data;
  }
};

export const searchUsers = async(q) => {
  const { data } = await axiosInstance.get(`/users/search?q=${q}`);
  return data;
};

