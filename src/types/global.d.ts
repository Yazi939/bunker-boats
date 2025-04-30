// Global type declarations for the application

interface ApiServices {
  authService: any;
  vehicleService: any;
  shiftService: any;
  fuelService: any;
}

declare global {
  interface Window {
    electronAPI?: any;
    api?: ApiServices;
  }
}

export {}; 