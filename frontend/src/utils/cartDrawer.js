
export const openCartDrawer = () => {
  window.dispatchEvent(new Event('openCartDrawer'));
};

export const closeCartDrawer = () => {
  window.dispatchEvent(new Event('closeCartDrawer'));
};