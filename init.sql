-- Create the user schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS "user";

-- Grant permissions to the postgres user
GRANT ALL PRIVILEGES ON SCHEMA "user" TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "user" TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "user" TO postgres;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA "user" GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA "user" GRANT ALL ON SEQUENCES TO postgres;

-- Create the stories schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS "storie";

-- Grant permissions to the postgres user
GRANT ALL PRIVILEGES ON SCHEMA "storie" TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "storie" TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "storie" TO postgres;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA "storie" GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA "storie" GRANT ALL ON SEQUENCES TO postgres;
