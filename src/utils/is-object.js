const isObject = value => {
  return (value && typeof value === "object" && value.constructor === Object) || false;
};

export default isObject;
