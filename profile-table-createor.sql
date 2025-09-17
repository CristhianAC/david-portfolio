create table profiles (
  id uuid references auth.users on delete cascade primary key,
  premium bool default false
);
