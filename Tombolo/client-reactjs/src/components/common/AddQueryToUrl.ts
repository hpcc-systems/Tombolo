type QueryPair = { queryName: string; queryValue: string };

export const addQueriesToUrl = ({ queryName, queryValue }: QueryPair): void => {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has(queryName)) {
    urlParams.set(queryName, queryValue);
  } else {
    urlParams.append(queryName, queryValue);
  }

  const newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
  window.history.pushState(null, '', newUrl);
};

export const getQueryParamsFromUrl = (): Record<string, string> => {
  const urlParams = new URLSearchParams(window.location.search);
  const queryParamsObject: Record<string, string> = {};

  for (const [key, value] of urlParams.entries()) {
    queryParamsObject[key] = value;
  }

  return queryParamsObject;
};
