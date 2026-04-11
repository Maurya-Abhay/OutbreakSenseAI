import os

import uvicorn


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    reload_enabled = os.getenv("NODE_ENV", "development").lower() == "development"

    uvicorn.run(
        "app.app:create_app",
        host="0.0.0.0",
        port=port,
        reload=reload_enabled,
        factory=True,
    )
