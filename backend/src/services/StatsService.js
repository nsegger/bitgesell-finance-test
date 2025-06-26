const fs = require("fs").promises;
const fsSync = require("fs");

class StatsService {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.statsCache = null;
    this.cacheTimestamp = null;
    this.isWarmingCache = false;
    this.warmingInterval = null;

    // Running totals for incremental updates
    this.runningStats = {
      count: 0,
      priceSum: 0,
      initialized: false,
    };

    // Track previous state to detect changes
    this.previousItems = null;

    // Initialize the service
    this.init();
  }

  // Initialize the service
  init() {
    // Initial cache warming on server start
    this.warmCache().then(() => {
      // After initial warming, load previous items for future comparisons
      fs.readFile(this.dataPath)
        .then((raw) => {
          this.previousItems = JSON.parse(raw);
        })
        .catch((err) =>
          console.error("Failed to load initial items state:", err)
        );
    });

    // Set up periodic cache warming (as a fallback)
    this.warmingInterval = setInterval(() => {
      const now = Date.now();
      if (!this.cacheTimestamp || now - this.cacheTimestamp > this.CACHE_TTL) {
        this.warmCache();
      }
    }, this.CACHE_TTL);

    // Watch for file changes to incrementally update or invalidate cache
    fsSync.watchFile(this.dataPath, async (curr, prev) => {
      if (curr.mtime === prev.mtime) {
        return;
      }

      console.log("File changed, updating stats cache");

      try {
        const raw = await fs.readFile(this.dataPath);
        const currentItems = JSON.parse(raw);

        // If we have previous items, try incremental update
        if (this.previousItems && this.runningStats.initialized) {
          // Find added, removed, and modified items
          const removedItems = this.previousItems.filter(
            (prevItem) =>
              !currentItems.some((currItem) => currItem.id === prevItem.id)
          );

          const addedItems = currentItems.filter(
            (currItem) =>
              !this.previousItems.some(
                (prevItem) => prevItem.id === currItem.id
              )
          );

          const modifiedItems = currentItems.filter((currItem) => {
            const prevItem = this.previousItems.find(
              (p) => p.id === currItem.id
            );
            return prevItem && prevItem.price !== currItem.price;
          });

          // If changes are minimal, do incremental updates
          if (
            addedItems.length + removedItems.length + modifiedItems.length <=
            5
          ) {
            console.log(
              `Performing incremental update: ${addedItems.length} added, ${removedItems.length} removed, ${modifiedItems.length} modified`
            );

            // Process removals
            removedItems.forEach((item) => {
              this.removeItemFromStats(item.id, this.previousItems);
            });

            // Process additions
            addedItems.forEach((item) => {
              this.addItemToStats(item);
            });

            // Process modifications
            modifiedItems.forEach((newItem) => {
              const oldItem = this.previousItems.find(
                (p) => p.id === newItem.id
              );
              this.updateItemInStats(oldItem, newItem);
            });

            return;
          }

          // Too many changes, do full recalculation
          console.log("Too many changes, performing full recalculation");
          await this.warmCache();

          return;
        }
        // No previous state, do full calculation
        await this.warmCache();

        // Update previous items for next comparison
        this.previousItems = currentItems;
      } catch (error) {
        console.error("Error processing file change:", error);
        this.statsCache = null;
        this.cacheTimestamp = null;
        // Force full recalculation next time
        await this.warmCache();
      }
    });
  }

  // Clean up resources
  cleanup() {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }
    fsSync.unwatchFile(this.dataPath);
  }

  // Function to calculate stats from running totals
  getStatsFromRunning() {
    return {
      total: this.runningStats.count,
      averagePrice:
        this.runningStats.count > 0
          ? this.runningStats.priceSum / this.runningStats.count
          : 0,
    };
  }

  // Function to calculate stats from scratch
  async calculateStatsFromScratch() {
    try {
      const raw = await fs.readFile(this.dataPath);
      const items = JSON.parse(raw);

      // Reset running totals
      this.runningStats.count = items.length;
      this.runningStats.priceSum = items.reduce(
        (acc, cur) => acc + cur.price,
        0
      );
      this.runningStats.initialized = true;

      // Return calculated stats
      return this.getStatsFromRunning();
    } catch (error) {
      console.error("Error calculating stats from scratch:", error);
      throw error;
    }
  }

  // Function to incrementally update stats when an item is added
  addItemToStats(item) {
    if (!this.runningStats.initialized) return false;

    this.runningStats.count++;
    this.runningStats.priceSum += item.price;

    // Update the cache
    this.statsCache = this.getStatsFromRunning();
    this.cacheTimestamp = Date.now();

    console.log(`Stats incrementally updated: added item ${item.id}`);
    return true;
  }

  // Function to incrementally update stats when an item is removed
  removeItemFromStats(itemId, items) {
    if (!this.runningStats.initialized) return false;

    const item = items.find((i) => i.id === itemId);
    if (!item) return false;

    this.runningStats.count--;
    this.runningStats.priceSum -= item.price;

    // Update the cache
    this.statsCache = this.getStatsFromRunning();
    this.cacheTimestamp = Date.now();

    console.log(`Stats incrementally updated: removed item ${itemId}`);
    return true;
  }

  // Function to incrementally update stats when an item is modified
  updateItemInStats(oldItem, newItem) {
    if (!this.runningStats.initialized) return false;

    // Only price affects our stats
    if (oldItem.price !== newItem.price) {
      this.runningStats.priceSum =
        this.runningStats.priceSum - oldItem.price + newItem.price;

      // Update the cache
      this.statsCache = this.getStatsFromRunning();
      this.cacheTimestamp = Date.now();

      console.log(`Stats incrementally updated: modified item ${newItem.id}`);
    }
    return true;
  }

  // Function to asynchronously warm the cache
  async warmCache() {
    // Prevent multiple simultaneous warming operations
    if (this.isWarmingCache) return;

    this.isWarmingCache = true;
    console.log("Warming stats cache...");

    try {
      this.statsCache = await this.calculateStatsFromScratch();
      this.cacheTimestamp = Date.now();
      console.log(
        "Stats cache warmed successfully at",
        new Date(this.cacheTimestamp).toLocaleTimeString()
      );
    } catch (error) {
      console.error("Cache warming failed:", error);
    } finally {
      this.isWarmingCache = false;
    }
  }

  // Get stats, using cache if available
  async getStats() {
    const now = Date.now();

    // Return cached stats if available and not expired
    if (
      this.statsCache &&
      this.cacheTimestamp &&
      now - this.cacheTimestamp < this.CACHE_TTL
    ) {
      return this.statsCache;
    }

    // Cache is expired or doesn't exist
    if (!this.isWarmingCache) {
      // Trigger async cache warming if not already in progress
      this.warmCache();
    }

    // If we have stale cache, use it rather than making user wait
    // Not sure if this is worth it, in a real app we would probably have a
    // Stale While Revalidate system in place in the frontend.
    if (this.statsCache) {
      return this.statsCache;
    }

    // No cache available at all, calculate synchronously this one time
    const stats = await this.calculateStatsFromScratch();
    this.cacheTimestamp = now;
    return stats;
  }
}

module.exports = StatsService;
