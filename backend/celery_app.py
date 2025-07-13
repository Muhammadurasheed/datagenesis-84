from celery import Celery
from app.config import settings

# Create Celery app
celery_app = Celery(
    "datagenesis_workers",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=['app.tasks.generation', 'app.tasks.analytics']
)

# Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task routing
    task_routes={
        'app.tasks.generation.*': {'queue': 'generation'},
        'app.tasks.analytics.*': {'queue': 'analytics'},
    },
    
    # Performance settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
)

if __name__ == '__main__':
    celery_app.start()