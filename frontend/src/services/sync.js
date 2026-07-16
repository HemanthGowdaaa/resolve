import apiClient from "./api";

export const SyncService = {
  syncData: async (payload) => {
    const response = await apiClient.post("/sync/", payload);
    return response.data;
  }
};
export default SyncService;
