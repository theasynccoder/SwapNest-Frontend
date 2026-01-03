-- Table for storing email verification codes
create table if not exists email_verifications (
  email text primary key,
  code text not null,
  created_at timestamp with time zone default now()
);