import apiService from '../api';

import { LoginForm, RegisterForm, ApiResponse, AuthState } from '../../types';



export const authApi = {

  login: (credentials: LoginForm) => apiService.login(credentials),

  register: (userData: RegisterForm) => apiService.register(userData),

  logout: () => apiService.logout(),

  getCurrentUser: () => apiService.getCurrentUser(),

  updateProfile: (userData: Parameters<typeof apiService.updateProfile>[0]) =>

    apiService.updateProfile(userData),

  verifyOTP: (userId: string, otp: string) => apiService.verifyOTP(userId, otp),

  resendOTP: (userId: string) => apiService.resendOTP(userId),

  forgotPassword: (email: string) => apiService.forgotPassword(email),

  resetPassword: (email: string, otp: string, newPassword: string) =>

    apiService.resetPassword(email, otp, newPassword),

  refreshAuthToken: (refreshToken: string) => apiService.refreshAuthToken(refreshToken),

};



export type AuthApi = typeof authApi;

