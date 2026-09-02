# GDM Supabase Migration

Implementation is being aligned to the current Supabase schema. Do not reintroduce Firebase/Firestore calls in migrated modules.

Current task constraints:
- status: pending | in_progress | completed
- priority: low | medium | high | none
- progress: 0–100

Known foreign-key relationships from schema review:
- tasks.created_by -> profiles.id
- tasks.assigned_to -> people.id
- tasks.department_id -> departments.id
- tasks.ministry_id -> ministries.id
- task_assignment_history.assigned_by -> profiles.id
- task_assignment_history.person_id -> people.id
- task_assignment_history.task_id -> tasks.id
- reports.prepared_by -> people.id
- role_permissions.permission_id -> system_permissions.id

Important: preserve these actual database relationships until a deliberate schema migration changes them. Do not silently substitute profile_* tables or profiles for people.
