select p.id, p.email, p.role
from public.profiles p
where lower(p.email) = lower('faraz@scalebrands.ca');