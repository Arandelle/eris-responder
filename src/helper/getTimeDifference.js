export const getTimeDifference = (timestamp) =>{
  const now = new Date();
  const addedTime = new Date(timestamp)

  const diffInSeconds = Math.floor((now - addedTime) / 1000) // Difference in seconds
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = now.getMonth() -addedTime.getMonth() + 12 * (now.getFullYear() - addedTime.getFullYear());
  const diffInYears = now.getFullYear() - addedTime.getFullYear();

  if (diffInSeconds < 60 ) return `Just now`; // if value of seconds is greater than 59 this will bypass
  if (diffInMinutes === 1) return `1 minute ago`; // Exactly 1 minute
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours === 1) return `1 hour ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInDays === 0) return `Today`
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 30) return `${diffInDays} days ago`;
  if (diffInMonths === 1) return `Last month`;
  if (diffInMonths < 12 ) return `${diffInMonths} months ago`

  return `${diffInYears} years ago`
}