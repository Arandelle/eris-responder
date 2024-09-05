export const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };