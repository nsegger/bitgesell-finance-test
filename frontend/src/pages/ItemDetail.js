import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Api from "../services/api";

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setError(null);

    const fetchItem = async () => {
      try {
        const data = await Api.getItem(id, signal);
        if (!signal.aborted) {
          setItem(data);
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error(`Error fetching item ${id}:`, err);
          setError(err.message || "Failed to load item");
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchItem();

    // Clean up function to abort fetch when unmounting or when id changes
    return () => {
      controller.abort();
    };
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!item) return <p>Item not found</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>{item.name}</h2>
      <p>
        <strong>Category:</strong> {item.category}
      </p>
      <p>
        <strong>Price:</strong> ${item.price}
      </p>
    </div>
  );
}

export default ItemDetail;
