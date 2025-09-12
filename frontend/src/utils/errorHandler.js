// Global error handler for API responses
export const handleApiError = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (errorData.code === "DEVICE_MISMATCH") {
      // Clear local storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return;
    }
    
    throw new Error(errorData.message || "An error occurred");
  }
  
  return response;
};

// Wrapper for fetch requests with error handling
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return await handleApiError(response);
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

