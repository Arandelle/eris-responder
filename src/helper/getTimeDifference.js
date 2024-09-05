export const getTimeDifference = (timestamp) => {
    const now = new Date();
    const addedTime = new Date(timestamp);
  
    const diff = Math.floor((now - addedTime) / 1000); // Difference in seconds
    if (diff < 60) return `${diff} seconds ago`;
  
    const diffInMinutes = Math.floor(diff / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
  
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  
    
  };
  