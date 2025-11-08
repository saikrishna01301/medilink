export const formatSpecialty = (specialty: string | null | undefined): string => {
  if (!specialty) {
    return "";
  }

  return specialty
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word === "&") {
        return "&";
      }
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};


