# Solution Documentation

## Backend (Node.js)

### 1. Refactored blocking I/O

**File:** `src/routes/items.js`

- Replaced synchronous `fs.readFileSync` and `fs.writeFileSync` with asynchronous `fs.promises` versions
- Updated route handlers to use `async/await` for better readability and error handling
- Alternative approaches could have included:
  - Using callbacks instead of promises
  - Using streams for larger files
  - Using a database instead of file system for better performance

### 2. Performance Optimization

**Files:** `src/services/StatsService.js`, `src/routes/stats.js`

- Implemented a dedicated service class to handle stats calculation and caching
- Added multiple optimization strategies:
  1. **Time-based caching** with configurable TTL
  2. **Incremental updates** to avoid full recalculation for small changes
  3. **Change detection** to identify added, removed, and modified items
  4. **Smart fallback** to use stale cache data while refreshing in background
- Applied proper separation of concerns with service layer architecture
- Alternative approaches could have included:
  - Using Redis or another external cache
  - Implementing ETag or conditional requests for HTTP caching

### 3. Testing

**File:** `tests/items.test.js`

- Added unit tests for items routes covering happy paths and error cases
- Used Jest and Supertest for API testing
- Mocked filesystem operations to isolate tests
- Alternative approaches could have included:
  - Integration tests with actual file system
  - End-to-end tests with a real server
  - More granular unit tests for utility functions

## Frontend (React)

### 1. Fixed Memory Leak

**Files:** `src/pages/Items.js`, `src/state/DataContext.js`, `src/pages/ItemDetail.js`

- Implemented AbortController to cancel fetch requests when the component unmounts
- Added proper signal handling in both the component and the data context
- Prevented state updates after component unmount by checking for aborted signals
- Debounce search string to avoid excessive API calls
  - Improve UX by reducing user actions needed to search
- Alternative approaches could have included:
  - Using a boolean flag approach (less robust)
  - Using a library like SWR or React Query that handles this automatically
  - Using a custom hook to manage fetch lifecycle

### 2. Pagination & Search

**Files:** `src/state/DataContext.js`, `src/pages/Items.js`, `backend/src/routes/items.js`, `src/services/api.js`

- Implemented client-side search input and pagination controls
- Updated backend to support pagination with limit and offset parameters
- Added server-side search functionality
- Added an API service abstraction for backend fetches (in a real app this would handle JWT refreshal/Unauthorized and other errors)
- Alternative approaches could have included:
  - Implementing cursor-based pagination instead of offset
  - Using a more sophisticated search algorithm (e.g., fuzzy search)
  - Implementing filtering by additional parameters

### 3. Performance - Virtualization

**File:** `src/pages/Items.js`

- Integrated react-window for virtualized list rendering
- Alternative approaches could have included:
  - Using react-virtualized instead
  - Implementing infinite scrolling

### 4. UI/UX Polish

**File:** `src/pages/Items.js`

- Added simple loading state indicators
- Improved error handling
- Enhanced accessibility with proper ARIA labels
- Alternative approaches could have included:
  - Using skeleton loaders instead of text for loading states
  - Implementing more advanced UI components
  - Adding animations for transitions
  - Improving layout for UX

## Architecture Improvements

### 1. Service Layer Pattern

**Files:** `src/services/StatsService.js`, `src/routes/stats.js`

- Extracted business logic from route handlers into dedicated service classes
- Implemented proper encapsulation with private state and public methods
- Applied single responsibility principle to improve maintainability
- Alternative approaches could have included:
  - Using a more formal dependency injection pattern
  - Implementing a repository pattern for data access
  - Implementing MVC pattern
