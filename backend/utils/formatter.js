export const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace("-", "").replace("_", ""),
      );
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

export const sanitizeResponse = (data, canShowAll) => {
  if (canShowAll) return data;

  const keysToRemove = ["inventoryType", "saleType", "orderType"];

  const removeKeys = (obj) => {
    const newObj = { ...obj };
    keysToRemove.forEach((key) => delete newObj[key]);
    return newObj;
  };

  return Array.isArray(data) ? data.map(removeKeys) : removeKeys(data);
};
