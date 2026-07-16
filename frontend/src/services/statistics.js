import apiClient from "./api";

export const StatisticsService = {
  getStatistics: async () => {
    const response = await apiClient.get("/statistics/");
    return response.data;
  }
};
export default StatisticsService;
