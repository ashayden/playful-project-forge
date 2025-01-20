-- Enable the necessary extensions
create extension if not exists "uuid-ossp";

-- Create the conversations table
create table if not exists conversations (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create the messages table
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  role text not null check (role in ('user', 'assistant')),
  conversation_id uuid references conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table conversations enable row level security;
alter table messages enable row level security;

-- Create policies for conversations
create policy "Users can view their own conversations"
  on conversations for select
  using (auth.uid() = user_id);

create policy "Users can create their own conversations"
  on conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on conversations for delete
  using (auth.uid() = user_id);

-- Create policies for messages
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    auth.uid() in (
      select user_id from conversations
      where id = messages.conversation_id
    )
  );

create policy "Users can create messages in their conversations"
  on messages for insert
  with check (
    auth.uid() in (
      select user_id from conversations
      where id = conversation_id
    )
  );

create policy "Users can update their own messages"
  on messages for update
  using (auth.uid() = user_id);

create policy "Users can delete messages in their conversations"
  on messages for delete
  using (
    auth.uid() in (
      select user_id from conversations
      where id = conversation_id
    )
  );

-- Create updated_at trigger function
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger set_conversations_updated_at
  before update on conversations
  for each row
  execute function handle_updated_at();

create trigger set_messages_updated_at
  before update on messages
  for each row
  execute function handle_updated_at(); 