const API_URL = "http://localhost:3001/api";

const getItems = async (search, limit, offset, signal) => {
  // If search is provided, add it to the URL
  // Otherwise, just add the limit and offset
  const url = `${API_URL}/items?${
    search ? `q=${encodeURIComponent(search)}&` : ""
  }limit=${limit}&offset=${offset}`;

  const response = await fetch(url, { signal });
  return response.json();
};

const getItem = async (id, signal) => {
  const response = await fetch(`${API_URL}/items/${id}`, { signal });
  return response.json();
};

export default { getItems, getItem };
