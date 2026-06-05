# Authentication Flows

## Current Flows

- Public self-registration uses Supabase Auth email/password signup. Caller-provided role or metadata is not accepted; the database provisioning trigger defaults public users to `student`.
- Account-settings password changes use `/api/auth/password/change` and delegate current password verification to Supabase Auth with `current_password`.
- Recovery password resets use `/api/auth/password/reset` only after a Supabase recovery link has been confirmed and a short-lived signed recovery marker cookie is present.
- Admin-created users are created through Supabase Admin Auth. Passwords are sent only to Supabase Auth and must not be stored, hashed, logged, or shared through insecure channels.

## Future Supabase Invite Flow

Invite Flow is not implemented yet. Future invite onboarding should preserve these rules:

- Use trusted Auth app metadata such as `raw_app_meta_data.provision_role`; never trust client-controlled user metadata for roles.
- Keep provisioning idempotent for `profiles`, `user_roles`, `students`, `teachers`, teacher assignment, and billing setup.
- Do not assume every user is only self-registered or fully admin-created with a password.
- Avoid duplicate profile/student records when an invited user accepts an invitation.
- Future lifecycle states may include `invited`, `pending`, `invitation_accepted`, `provisioned`, and `active`.
