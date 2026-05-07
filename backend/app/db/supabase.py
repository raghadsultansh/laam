from supabase import create_client, Client
from app.core.config import settings

# Service role client — bypasses RLS, used for all backend operations.
# Never expose this client or the service role key to the frontend.
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)
