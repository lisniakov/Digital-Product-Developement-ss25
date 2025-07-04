// services/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your development machine’s LAN IP (shown by ifconfig/ipconfig)
const REAL_DEVICE_IP = '192.168.178.27';

// Compute HOST at load time: emulator vs real device vs iOS
let HOST;
if (Platform.OS === 'android') {
  // Android emulator uses 10.0.2.2; real device uses your LAN IP
  HOST = __DEV__ ? '10.0.2.2' : REAL_DEVICE_IP;
} else {
  // iOS simulator can hit localhost; real iOS device (or production) should hit LAN IP
  HOST = __DEV__ ? 'localhost' : REAL_DEVICE_IP;
}

export const API = axios.create({
  baseURL: `http://${HOST}:4000`,
  headers: { 'Content-Type': 'application/json' },
});

// ──────────────────────────────────────────────────────────────
// Automatically attach the bearer token (if present)
// ──────────────────────────────────────────────────────────────
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ──────────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────────
export async function signUp({ email, password, fullName }) {
  const { data } = await API.post('/signup', { email, password, fullName });
  await AsyncStorage.setItem('authToken', data.token);
  await AsyncStorage.setItem('userFullName', data.nurse.fullName || '');
  return data.nurse;
}

export async function login({ email, password }) {
  const { data } = await API.post('/login', { email, password });
  await AsyncStorage.setItem('authToken', data.token);
  await AsyncStorage.setItem('userFullName', data.nurse.fullName || '');
  return data.nurse;
}

export async function logout() {
  await AsyncStorage.multiRemove(['authToken', 'userFullName', 'nurseProfile']);
}

// ──────────────────────────────────────────────────────────────
// NURSE PROFILE
// ──────────────────────────────────────────────────────────────
export const fetchMyProfile = () =>
  API.get('/me').then((r) => r.data);

export const updateMyProfile = (body) =>
  API.put('/me', body).then((r) => r.data);

export const changePassword = ({ currentPassword, newPassword }) =>
  API.put('/me/password', { currentPassword, newPassword }).then((r) => r.data);

// ──────────────────────────────────────────────────────────────
// RESIDENTS & INCIDENT REPORTS
// ──────────────────────────────────────────────────────────────
export const fetchAllResidents = () =>
  API.get('/residents').then((r) => r.data);

export const saveIncidentReport = ({ residentId, narrative }) =>
  API.post('/incident-reports', { residentId, narrative }).then((r) => r.data);

export const fetchReportsForResident = (residentId) =>
  API.get(`/incident-reports/resident/${residentId}`).then((r) => r.data);
