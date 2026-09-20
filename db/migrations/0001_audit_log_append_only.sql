-- The audit log is append-only: INSERT and SELECT only.
--
-- GRANT/REVOKE alone is not enough, because a table owner bypasses its own
-- table privileges. Triggers are the real control; the REVOKE is defence in
-- depth for any non-owner role the app connects as later.
--
-- Row triggers do not see TRUNCATE, so that needs its own statement trigger.

REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "audit_log" FROM PUBLIC;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION audit_log_is_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: % is not permitted', TG_OP
    USING ERRCODE = '42501';
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_log_no_mutate ON "audit_log";
--> statement-breakpoint
CREATE TRIGGER audit_log_no_mutate
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_is_append_only();
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_log_no_truncate ON "audit_log";
--> statement-breakpoint
CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_is_append_only();
