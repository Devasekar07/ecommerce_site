from fastapi import FastAPI

from app.api.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Fashion Rail AI Service",
        version="0.1.0",
        description="Phase 1 health-check shell for the future shopping assistant.",
    )
    app.include_router(health_router)
    return app


app = create_app()
