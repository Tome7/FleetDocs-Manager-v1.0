import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  register: async (userData: {
    staff_no: string;
    name: string;
    email: string;
    password: string;
    department: string;
    role?: string;
  }) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },
};

// Vehicles API
export const vehiclesApi = {
  getAll: async () => {
    const { data } = await api.get('/vehicles');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/vehicles/${id}`);
    return data;
  },
  create: async (vehicleData: {
    license_plate: string;
    model: string;
    department: string;
    fleet?: string;
    status?: string;
  }) => {
    const { data } = await api.post('/vehicles', vehicleData);
    return data;
  },
  update: async (id: string, vehicleData: any) => {
    const { data } = await api.put(`/vehicles/${id}`, vehicleData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/vehicles/${id}`);
    return data;
  },
};

// Documents API (Documentos dos Veículos)
export const documentsApi = {
  getAll: async () => {
    const { data } = await api.get('/documents');
    return data;
  },
  getByVehicle: async (vehicleId: string) => {
    const { data } = await api.get(`/documents/vehicle/${vehicleId}`);
    return data;
  },
  create: async (documentData: {
    vehicle_id: string;
    file_name: string;
    file_type: string;
    expiry_date?: string;
    storage_location?: string;
  }) => {
    const { data } = await api.post('/documents', documentData);
    return data;
  },
  upload: async (formData: FormData) => {
    const { data } = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  replaceFile: async (id: string, formData: FormData) => {
    const { data } = await api.post(`/documents/${id}/replace-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  download: async (id: string) => {
    const response = await api.get(`/documents/download/${id}`, {
      responseType: 'blob',
    });
    return response;
  },
  update: async (id: string, documentData: any) => {
    const { data } = await api.put(`/documents/${id}`, documentData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },
};

// Driver Documents API (Documentos dos Motoristas)
export const driverDocumentsApi = {
  getAll: async () => {
    const { data } = await api.get('/driver-documents');
    return data;
  },
  getByDriver: async (driverId: string) => {
    const { data } = await api.get(`/driver-documents/driver/${driverId}`);
    return data;
  },
  create: async (documentData: {
    driver_id: string;
    doc_name: string;
    doc_type: string;
    issue_date?: string;
    expiry_date?: string;
    storage_location?: string;
    notes?: string;
  }) => {
    const { data } = await api.post('/driver-documents', documentData);
    return data;
  },
  upload: async (formData: FormData) => {
    const { data } = await api.post('/driver-documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  replaceFile: async (id: string, formData: FormData) => {
    const { data } = await api.post(`/driver-documents/${id}/replace-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  download: async (id: string) => {
    const response = await api.get(`/driver-documents/download/${id}`, {
      responseType: 'blob',
    });
    return response;
  },
  update: async (id: string, documentData: any) => {
    const { data } = await api.put(`/driver-documents/${id}`, documentData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/driver-documents/${id}`);
    return data;
  },
  updateStatuses: async () => {
    const { data } = await api.post('/driver-documents/update-statuses');
    return data;
  },
};

// Drivers API (Motoristas - separados dos usuários)
export const driversApi = {
  getAll: async () => {
    const { data } = await api.get('/drivers');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/drivers/${id}`);
    return data;
  },
  create: async (driverData: {
    staff_no: string;
    name: string;
    contact: string;
    department?: string;
    fleet?: string;
    status?: string;
  }) => {
    const { data } = await api.post('/drivers', driverData);
    return data;
  },
  update: async (id: string, driverData: any) => {
    const { data } = await api.put(`/drivers/${id}`, driverData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/drivers/${id}`);
    return data;
  },
  assignVehicle: async (driverId: string, vehicleId: string) => {
    const { data } = await api.post(`/drivers/${driverId}/assign-vehicle`, { vehicle_id: vehicleId });
    return data;
  },
  unassignVehicle: async (driverId: string) => {
    const { data } = await api.post(`/drivers/${driverId}/unassign-vehicle`);
    return data;
  },
  transferVehicle: async (vehicleId: string, fromDriverId: string, toDriverId: string) => {
    const { data } = await api.post('/drivers/transfer-vehicle', {
      vehicle_id: vehicleId,
      from_driver_id: fromDriverId,
      to_driver_id: toDriverId,
    });
    return data;
  },
  uploadPhoto: async (driverId: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await api.post(`/drivers/${driverId}/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  deletePhoto: async (driverId: string) => {
    const { data } = await api.delete(`/drivers/${driverId}/photo`);
    return data;
  },
};

// Users API
export const usersApi = {
  getAll: async () => {
    const { data } = await api.get('/users');
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get('/users/profile');
    return data;
  },
  update: async (id: string, userData: any) => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },
};

export const flowRecordsApi = {
  getAll: async () => {
    const { data } = await api.get('/flow-records');
    return data;
  },
  getByVehicle: async () => {
    const { data } = await api.get('/flow-records/by-vehicle');
    return data;
  },
  getByVehicleId: async (vehicleId: string) => {
    const { data } = await api.get(`/flow-records/vehicle/${vehicleId}`);
    return data;
  },
  getByDocument: async (documentId: string) => {
    const { data } = await api.get(`/flow-records/document/${documentId}`);
    return data;
  },
  getByDriver: async (driverId: string) => {
    const { data } = await api.get(`/flow-records/driver/${driverId}`);
    return data;
  },
  createWithdrawal: async (data: any) => {
    const response = await api.post('/flow-records/withdrawal', data);
    return response.data;
  },
  createReturn: async (data: any) => {
    const response = await api.post('/flow-records/return', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/flow-records/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/flow-records/${id}`);
    return response.data;
  },
  deleteByVehicle: async (vehicleId: string) => {
    const response = await api.delete(`/flow-records/vehicle/${vehicleId}`);
    return response.data;
  },
};

export const alertsApi = {
  getAll: async () => {
    const { data } = await api.get('/alerts');
    return data;
  },
  markSent: async (id: string) => {
    const { data } = await api.put(`/alerts/${id}/mark-sent`);
    return data;
  },
  generate: async () => {
    const { data } = await api.post('/alerts/generate');
    return data;
  },
};

export const reportsApi = {
  getExpiringDocuments: async () => {
    const { data } = await api.get('/reports/expiring-documents');
    return data;
  },
  getFlowRecords: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const { data } = await api.get(`/reports/flow-records?${params.toString()}`);
    return data;
  },
  getDriverProfile: async (driverId: string) => {
    const { data } = await api.get(`/reports/driver-profile/${driverId}`);
    return data;
  },
  getAllDocuments: async () => {
    const { data } = await api.get('/reports/all-documents');
    return data;
  },
  getFleetSummary: async () => {
    const { data } = await api.get('/reports/fleet-summary');
    return data;
  },
  getComprehensiveReport: async () => {
    const { data } = await api.get('/reports/comprehensive');
    return data;
  },
};

// Vehicle Condition API
export const vehicleConditionApi = {
  getByVehicle: async (vehicleId: string) => {
    const { data } = await api.get(`/vehicle-condition/vehicle/${vehicleId}`);
    return data;
  },
  getLatest: async (vehicleId: string) => {
    const { data } = await api.get(`/vehicle-condition/vehicle/${vehicleId}/latest`);
    return data;
  },
  getAll: async () => {
    const { data } = await api.get('/vehicle-condition');
    return data;
  },
  create: async (conditionData: any) => {
    const { data } = await api.post('/vehicle-condition', conditionData);
    return data;
  },
  update: async (id: string, conditionData: any) => {
    const { data } = await api.put(`/vehicle-condition/${id}`, conditionData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/vehicle-condition/${id}`);
    return data;
  },
};

// Post-Trip Inspection API
export const postTripInspectionApi = {
  getAll: async (params?: { date?: string; start_date?: string; end_date?: string }): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    const url = queryParams.toString() ? `/post-trip-inspections?${queryParams}` : '/post-trip-inspections';
    const { data } = await api.get(url);
    return data;
  },
  getToday: async (): Promise<any[]> => {
    const { data } = await api.get('/post-trip-inspections/today');
    return data;
  },
  getByType: async (type: string): Promise<any[]> => {
    const { data } = await api.get(`/post-trip-inspections/type/${type}`);
    return data;
  },
  getPending: async (type: string): Promise<any[]> => {
    const { data } = await api.get(`/post-trip-inspections/pending/${type}`);
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/post-trip-inspections/${id}`);
    return data;
  },
  create: async (inspectionData: any) => {
    const { data } = await api.post('/post-trip-inspections', inspectionData);
    return data;
  },
  update: async (id: string, inspectionData: any) => {
    const { data } = await api.put(`/post-trip-inspections/${id}`, inspectionData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/post-trip-inspections/${id}`);
    return data;
  },
  getStats: async () => {
    const { data } = await api.get('/post-trip-inspections/stats/summary');
    return data;
  },
};

// Pending Inspections API
export const pendingInspectionsApi = {
  getAll: async (): Promise<any[]> => {
    const { data } = await api.get('/pending-inspections');
    return data;
  },
  getByType: async (type: string): Promise<any[]> => {
    const { data } = await api.get(`/pending-inspections/type/${type}`);
    return data;
  },
  getSummary: async () => {
    const { data } = await api.get('/pending-inspections/summary');
    return data;
  },
  create: async (data: any) => {
    const response = await api.post('/pending-inspections', data);
    return response.data;
  },
  markInspected: async (id: string, inspectionId: string) => {
    const { data } = await api.put(`/pending-inspections/${id}/inspected`, { inspection_id: inspectionId });
    return data;
  },
  cancel: async (id: string) => {
    const { data } = await api.put(`/pending-inspections/${id}/cancel`);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/pending-inspections/${id}`);
    return data;
  },
};

export default api;