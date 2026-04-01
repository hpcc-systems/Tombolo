export const isAdminOrWorkunitPath = (pathname: string): boolean => {
  return pathname.startsWith('/admin') || pathname.startsWith('/workunits');
};
