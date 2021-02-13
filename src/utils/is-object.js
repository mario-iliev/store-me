const isObject = value => {
  return value && typeof value === "object" && value.constructor === Object;
};

export default isObject;
