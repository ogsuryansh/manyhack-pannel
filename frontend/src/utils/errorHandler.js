// Global error handler for API responses
export const handleApiError = async (response) => {
  if (!response.ok) {
    let errorData = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON error response:', text);
        errorData = { 
          message: `Server error (${response.status}): ${text.substring(0, 100)}`,
          code: "NON_JSON_RESPONSE"
        };
      }
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError);
      errorData = { 
        message: `Failed to parse server response (${response.status})`,
        code: "PARSE_ERROR"
      };
    }
    
    if (errorData.code === "DEVICE_MISMATCH" || errorData.code === "DEVICE_ALREADY_LOGGED_IN") {
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

