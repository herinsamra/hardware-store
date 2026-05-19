export const LOCAL_STORE_CODE = '01311594006648815184';
export const LOCAL_AVAILABILITY = 'in_stock';
export const LOCAL_QUANTITY = 10;

export function getLocalInventoryDefaults() {
  return {
    storeCode: LOCAL_STORE_CODE,
    availability: LOCAL_AVAILABILITY,
    quantity: LOCAL_QUANTITY,
  };
}
