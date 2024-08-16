# lucia-adapter-xata

## Lucia Adapter for Xata

### Installation

`npm i lucia-adapter-xata`

### Information

Due to the way that Xata works, your users and sessions table will need to have the same names as the ones in the example schema below.

Users - `auth_users`
Sessions - `auth_sessions`

### Example Xata Schema

```json
{
  "tables": [
    {
      "name": "auth_users",
      "columns": [
        {
          "name": "email",
          "type": "email",
          "unique": true
        },
        {
          "name": "name",
          "type": "string",
          "defaultValue": ""
        }
      ],
      "revLinks": [
        {
          "column": "user",
          "table": "auth_sessions"
        }
      ]
    },
    {
      "name": "auth_sessions",
      "columns": [
        {
          "name": "user",
          "type": "link",
          "link": {
            "table": "auth_users"
          }
        },
        {
          "name": "expiresAt",
          "type": "datetime"
        }
      ]
    }
  ]
}
```

### Usage

```ts
import { getXataClient } from "<path to xata codegen>";

import { XataAdapter } from "lucia-adapter-xata";

const client = getXataClient();
const adapter = new XataAdapter(client);
```
