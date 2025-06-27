import React, { useEffect, useState, useCallback, useRef } from "react";
import { useData } from "../state/DataContext";
import { Link } from "react-router-dom";
import { FixedSizeList as List } from "react-window";

function Items() {
  const {
    items,
    loading,
    error,
    currentPage,
    totalItems,
    itemsPerPage,
    fetchItems,
    search,
    changePage,
  } = useData();
  const [searchInput, setSearchInput] = useState("");
  const debounceTimerRef = useRef(null);

  // Effect for debounced search
  useEffect(() => {
    // Create an AbortController for this search
    const controller = new AbortController();
    const { signal } = controller;

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer for debounce (300ms)
    debounceTimerRef.current = setTimeout(() => {
      search(searchInput, currentPage, signal);
    }, 300);

    // Clean up function to abort fetch and clear timer
    return () => {
      controller.abort();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, currentPage]);

  const handlePageChange = useCallback(
    (page) => {
      changePage(page);
    },
    [changePage]
  );

  // Virtualized row renderer
  const Row = ({ index, style }) => {
    const item = items[index];
    return (
      <div style={style} className="item-row">
        <Link to={`/items/${item.id}`}>{item.name}</Link>
        <span className="item-price">${item.price}</span>
      </div>
    );
  };

  // Generate pagination buttons
  const renderPagination = () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={currentPage === i ? "active" : ""}
          style={{
            margin: 4,
            color: currentPage === i ? "blue" : "black",
            fontWeight: currentPage === i ? "bold" : "normal",
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>
        {pages}
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    );
  };

  const renderList = () => {
    if (loading && !items.length) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!items.length) return <p>No items found</p>;

    return (
      <>
        <div className="items-list">
          <List
            height={400}
            width="100%"
            itemCount={items.length}
            itemSize={50}
          >
            {Row}
          </List>
        </div>

        {renderPagination()}
      </>
    );
  };

  return (
    <div className="items-container">
      <div className="search-div">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search items..."
          aria-label="Search items"
        />
      </div>
      {renderList()}
    </div>
  );
}

export default Items;
