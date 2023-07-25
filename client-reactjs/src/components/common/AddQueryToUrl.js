// A func that checks if there are existing query params, if so appends to them, if not creates one
const addQueriesToUrl = ({ queryName, queryValue }) => {
  //Get current URL and its existing queries
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has(queryName)) {
    urlParams.set(queryName, queryValue);
  } else {
    urlParams.append(queryName, queryValue);
  }

  const newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;

  //Replace the current URL with the new one
  window.history.pushState(null, '', newUrl);
};

// Get all params from url
const getQueryParamsFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const queryParamsObject = {};

  // Loop through all query parameters and convert them to an object
  for (const [key, value] of urlParams.entries()) {
    queryParamsObject[key] = value;
  }

  return queryParamsObject;
};

export default { addQueriesToUrl, getQueryParamsFromUrl };
