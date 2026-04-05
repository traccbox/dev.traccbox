import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const useGooglePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'AW-18061056579', {
        page_path: location.pathname,
      });
    }
  }, [location]);
};

export default useGooglePageTracking;