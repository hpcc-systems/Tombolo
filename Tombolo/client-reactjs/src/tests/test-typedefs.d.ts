declare module '@/services/auth.service' {
  const authService: any;
  export default authService;
}

declare module '@/services/apiClient' {
  const apiClient: any;
  export default apiClient;
}

declare module '@/services/clusterMonitoring.service' {
  const svc: any;
  export default svc;
}

declare module '@/services/fileMonitoring.service' {
  const svc: any;
  export default svc;
}

declare module '@/services/jobMonitoring.service' {
  const svc: any;
  export default svc;
}

declare module '@/services/costMonitoring.service' {
  const svc: any;
  export default svc;
}

// Do NOT override 'antd' module typings here — leave real antd types intact.
const antd: any;
