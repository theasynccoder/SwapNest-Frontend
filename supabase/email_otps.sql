-- Table for storing OTPs for email verification
create table if not exists email_otps (
  email text primary key,
  otp text not null,
  expires_at timestamp with time zone not null
);
