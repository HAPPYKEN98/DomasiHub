-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  reg_number text NOT NULL UNIQUE,
  whatsapp_number text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.listings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  posted_by text,
  title text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['marketplace'::text, 'printing'::text, 'accommodation'::text, 'airtel_money'::text, 'tnm_mpamba'::text, 'expert'::text])),
  price numeric NOT NULL DEFAULT 0,
  contact_number text NOT NULL,
  item_condition text,
  security_condition text,
  location_details text,
  image_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  agent_code text,
  CONSTRAINT listings_pkey PRIMARY KEY (id),
  CONSTRAINT listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.academic_resources (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  department text NOT NULL,
  academic_year text,
  course_code text,
  file_data text NOT NULL,
  uploaded_by text,
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT academic_resources_pkey PRIMARY KEY (id),
  CONSTRAINT academic_resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.campus_landmarks (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  latitude real NOT NULL,
  longitude real NOT NULL,
  contact_number text,
  CONSTRAINT campus_landmarks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bulletins (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  notice_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  posted_by text,
  event_date text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bulletins_pkey PRIMARY KEY (id),
  CONSTRAINT bulletins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);