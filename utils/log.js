const orange = "#ff7600";
const green = "#0AA11D";
const blue = "#0244bd";
const red = "#ff0000";
const black = "#2c2c2c";

const log = {
  debugUpdateTime: false,
  debugDataBuildTime: false,
  debugSubscriptions: false,
  measureUpdate: (componentsCount, time, accessors) =>
    console.log(
      `%c[1] React updated and rendered %c${componentsCount}%c components for %c${time}%c ms `,
      `color: ${black};`,
      `color: ${blue};`,
      `color: ${black};`,
      `color: ${time >= 100 ? red : time >= 50 ? orange : green};`,
      `color: ${black};`,
      accessors
    ),
  dataBuildTime: time =>
    console.log(
      `%c[2] StoreMe bilt components state for %c${time}%c ms`,
      `color: ${black};`,
      `color: ${blue};`,
      `color: ${black};`
    ),
  subscriptionsCount: count =>
    console.log(
      `%c[3] Current StoreMe connected components: %c${count}`,
      `color: ${black};`,
      `color: ${blue};`
    ),
};

export default log;
