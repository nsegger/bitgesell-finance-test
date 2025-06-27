import React, { createContext, useCallback, useContext, useState } from "react";
import Api from "../services/api";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  const fetchItems = useCallback(
    async (page = 1, query = null, signal) => {
      setLoading(true);
      setError(null);
      try {
        const limit = itemsPerPage;
        const offset = (page - 1) * itemsPerPage;

        const json = await Api.getItems(query, limit, offset, signal);

        // Check if the request was aborted before updating state
        if (!signal || !signal.aborted) {
          setItems(json.results);
          setTotalItems(json.total);
        }

        return json;
      } catch (err) {
        // Only update error state if the request wasn't aborted
        if (err.name !== "AbortError") {
          setError(err.message);
          throw err;
        }
      } finally {
        // Only update loading state if the request wasn't aborted
        if (!signal || !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [itemsPerPage]
  );

  const search = useCallback(
    (query, page = 1, signal) => {
      setSearchQuery(query);
      setCurrentPage(page);
      return fetchItems(page, query, signal);
    },
    [fetchItems]
  );

  const changePage = useCallback(
    (page) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  return (
    <DataContext.Provider
      value={{
        items,
        totalItems,
        loading,
        error,
        currentPage,
        searchQuery,
        itemsPerPage,
        fetchItems,
        search,
        changePage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
