# Switch from Firebase to Supabase

Firebase Realtime DB was the inherited off-chain state layer. It worked for prototyping but Supabase (Postgres) is a better fit: structured expense/split/settlement data maps naturally to relational tables, SQL enables complex balance queries, and Supabase's RLS policies provide proper access control. Firebase was removed entirely — no hybrid state.
