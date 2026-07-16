import apiClient from "./api";

export const ExportService = {
  exportJson: async () => {
    const response = await apiClient.get("/export/json/");
    return response.data;
  },

  exportCsv: async () => {
    const response = await apiClient.get("/export/csv/");
    return response.data;
  },

  exportPdf: async () => {
    const response = await apiClient.get("/export/pdf/", {
      responseType: "arraybuffer", // Arraybuffer handles binary PDF blobs properly on mobile
    });
    return response.data;
  }
};
export default ExportService;
