if (!__DEV__) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};

  const warn = console.warn.bind(console);
  const error = console.error.bind(console);

  console.warn = (message?: unknown) => {
    if (typeof message === 'string') warn(message);
  };

  console.error = (message?: unknown) => {
    if (typeof message === 'string') error(message);
  };
}
