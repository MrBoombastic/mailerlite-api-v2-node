// Mock for snakecase-keys package
module.exports = function snakecaseKeys(obj, options = {}) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const { deep = false } = options;

  function snakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  function transformKeys(input) {
    if (Array.isArray(input)) {
      return input.map(item => deep ? transformKeys(item) : item);
    }

    if (input !== null && typeof input === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(input)) {
        const newKey = snakeCase(key);
        result[newKey] = deep ? transformKeys(value) : value;
      }
      return result;
    }

    return input;
  }

  return transformKeys(obj);
};
