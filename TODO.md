# Task: Make Documents Tab Listing Dynamic

## Steps

### Step 1: Update `client-detail.component.ts`
- [x] Add document-related properties (documents, filteredDocuments, documentStats, pagination, search, category filter)
- [x] Add `loadDocuments()` method using `clientService.listDocuments()`
- [x] Add `loadDocumentStats()` method using `clientService.getDocumentStats()`
- [x] Add computed getters for pagination (documentsPaginated, documentsTotalPages, etc.)
- [x] Add document filtering methods (onDocumentsSearch, onDocumentsCategoryChange, applyDocumentsFilter)
- [x] Add document action methods (deleteDocument, downloadDocument)
- [x] Call loadDocuments() and loadDocumentStats() in ngOnInit()

### Step 2: Update `client-detail.component.html`
- [x] Replace hardcoded document stat pills with dynamic data from documentStats
- [x] Replace hardcoded document table rows with @for loop over filteredDocuments
- [x] Add search input binding to documentsSearch
- [x] Add category filter dropdown
- [x] Wire up action buttons (view, download, delete) with proper handlers
- [x] Add proper pagination with page numbers

### Step 3: Update `view-document.component.ts`
- [x] Inject ClientService
- [x] Fetch document details from API using clientService.getDocument()
- [x] Add loading state
- [x] Map API response to component properties

