# Feature Draft: Custom Plugins Management via Web UI

## 1. Summary
Allow users to create, edit, delete, and reload FlexGet custom plugins (Python files) directly from the Web UI.

The Web UI does **not** access the server filesystem directly. All file operations must be performed by the FlexGet backend through authenticated REST endpoints.

---

## 2. Scope

### In scope
- List custom plugin files available in the FlexGet plugins directory.
- Read a plugin file content.
- Create a new plugin file.
- Update an existing plugin file.
- Delete a plugin file.
- Trigger or guide a FlexGet reload/restart after changes.
- Provide clear validation and error feedback in the UI.

### Out of scope (initial version)
- Installing Python dependencies (`pip install`).
- Editing arbitrary files outside the plugins directory.
- Version control / git integration for plugin files.
- Automatic syntax validation beyond basic filename/content checks.

---

## 3. Architecture and Responsibilities

### Backend (FlexGet)
The backend is responsible for:
- Resolving the configured plugins directory.
- Validating filenames and paths.
- Reading/writing/deleting plugin files.
- Enforcing security rules.
- Returning structured JSON responses.
- Optionally reloading plugins or exposing a reload operation.

### Frontend (Web UI)
The frontend is responsible for:
- Rendering the plugin list and editor.
- Sending file name and content to the backend.
- Displaying loading, success, and error states.
- Preventing invalid submissions client-side (best effort).
- Prompting the user about reload/restart requirements.

The frontend **must not** construct or assume server paths.

---

## 4. Proposed Backend API

Base path suggestion: `/server/plugins` (or `/plugins/files`).

### 4.1 List plugin files
`GET /server/plugins`

Response:
```json
{
  "directory": "/config/plugins",
  "files": [
    {
      "name": "delete_watched.py",
      "size": 1234,
      "modified": "2026-11-08T12:00:00Z"
    }
  ]
}
```

### 4.2 Read plugin file
`GET /server/plugins/{name}`

Response:
```json
{
  "name": "delete_watched.py",
  "content": "def on_task_filter(entry, config): ..."
}
```

### 4.3 Create or update plugin file
`POST /server/plugins/{name}` or `PUT /server/plugins/{name}`

Request:
```json
{
  "content": "def on_task_filter(entry, config): ..."
}
```

Response:
```json
{
  "message": "Plugin saved successfully"
}
```

### 4.4 Delete plugin file
`DELETE /server/plugins/{name}`

Response:
```json
{
  "message": "Plugin deleted successfully"
}
```

### 4.5 Reload plugins (optional)
Reuse existing operation if available:

`POST /server/manage`
```json
{
  "operation": "reload"
}
```

If reload is not supported, the UI must instruct the user to restart FlexGet.

---

## 5. Security Requirements

Backend must enforce:
- Authentication and authorization (admin only).
- Filename validation:
  - Only `.py` files.
  - No path separators.
  - No `..`, null bytes, or absolute paths.
- Directory containment:
  - Resolve target path inside the configured plugins directory.
  - Reject any resolved path outside that directory.
- File size limits.
- Safe error messages (do not leak filesystem details).
- Rate limiting (recommended).

Frontend should:
- Validate filename extension before submit.
- Disable dangerous actions while requests are running.
- Confirm destructive actions (delete).

---

## 6. Frontend Implementation Plan

Create a new plugin under `src/plugins/custom-plugins/`.

### 6.1 File structure
```
src/plugins/custom-plugins/
  index.ts
  CustomPlugins.tsx
  hooks.ts
  types.ts
  CustomPlugins.spec.tsx
```

### 6.2 Registration
Register in `src/Root.tsx`:
```ts
import customPlugins from 'plugins/custom-plugins';
customPlugins();
```

### 6.3 UI layout
- Header with title "Custom Plugins".
- List of plugin files with:
  - name
  - size / modified date
  - actions: edit, delete
- Button "New Plugin".
- Editor panel/dialog using Monaco (reuse Config Editor approach).
- Save and Cancel actions.
- Alert banner for reload/restart requirement.

### 6.4 Hooks
Follow existing patterns (`useFlexgetAPI`, `useGlobalInfo`):

```ts
export const useGetPluginFiles = () => { ... };
export const useGetPluginFile = (name: string) => { ... };
export const useSavePluginFile = () => { ... };
export const useDeletePluginFile = () => { ... };
```

Content encoding should be consistent with `/server/raw_config` (UTF-8 or base64). Prefer UTF-8 JSON unless large binary content requires base64.

### 6.5 State management
- Use `useState` for selected file and editor content.
- Use `useGlobalInfo` for success/error messages.
- Use `useGlobalStatus` for loading indicators if appropriate.

---

## 7. UX Flow

1. User opens "Custom Plugins".
2. UI fetches and displays plugin files.
3. User selects a file or clicks "New Plugin".
4. Editor opens with file content.
5. User saves:
   - UI sends name + content to backend.
   - Backend writes file.
   - UI shows success message.
   - UI prompts user to reload/restart FlexGet.
6. User can delete a file after confirmation.

---

## 8. Testing Plan

Follow existing test patterns:
- `fetchMock` for API responses.
- Hook tests for list/read/save/delete.
- Component tests for:
  - empty state
  - loading state
  - successful save
  - validation errors
  - delete confirmation

Reference files:
- `src/plugins/config/Config.spec.tsx`
- `src/plugins/config/hooks.ts`

---

## 9. Limitations and Risks

- Plugins are loaded by FlexGet at startup or reload; saving a file does not guarantee immediate activation.
- Exposing file write endpoints increases security risk; strict validation is mandatory.
- Custom plugins may contain syntax/runtime errors; UI cannot fully validate Python code.
- Different FlexGet installations may use different plugin directories.

---

## 10. Milestones

### Milestone 1: Backend support
- Implement list/read/write/delete endpoints.
- Add security validation.

### Milestone 2: Frontend plugin
- Create plugin module and registration.
- Implement list + editor UI.

### Milestone 3: Integration and tests
- Add hooks and component tests.
- Add reload/restart guidance.

### Milestone 4: Polish
- Improve validation and error handling.
- Add documentation and examples.

---

## 11. Open Questions

- Does FlexGet support runtime plugin reload, or is restart required?
- Should plugin content be stored as UTF-8 JSON or base64?
- Should the feature be restricted to admin users only?
- Should the UI allow editing files with extensions other than `.py`?
