--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_package_assignments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_package_assignments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_package_assignments_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: donations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    ngo_id text NOT NULL,
    package_id text NOT NULL,
    package_title text NOT NULL,
    package_amount numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    payment_method text DEFAULT 'card'::text NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    transaction_id text,
    invoice_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    donor_name character varying(255),
    donor_email character varying(255),
    occasion character varying(255)
);


ALTER TABLE public.donations OWNER TO postgres;

--
-- Name: ngos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ngos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    mission text,
    website text,
    logo_url text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text,
    phone text,
    email text,
    registration_number text,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    our_story text,
    about_us text,
    contact_info text,
    photo_url text
);


ALTER TABLE public.ngos OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    package_id uuid NOT NULL,
    ngo_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1,
    status character varying(50) DEFAULT 'pending'::character varying,
    razorpay_order_id character varying(255),
    payment_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: package_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    package_id uuid NOT NULL,
    ngo_id uuid,
    vendor_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_assignment_type CHECK ((((ngo_id IS NOT NULL) AND (vendor_id IS NULL)) OR ((ngo_id IS NULL) AND (vendor_id IS NOT NULL))))
);


ALTER TABLE public.package_assignments OWNER TO postgres;

--
-- Name: TABLE package_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.package_assignments IS 'Many-to-many relationships between packages and NGOs/vendors';


--
-- Name: COLUMN package_assignments.package_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.package_assignments.package_id IS 'Reference to the package';


--
-- Name: COLUMN package_assignments.ngo_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.package_assignments.ngo_id IS 'Reference to the NGO (nullable if vendor_id is set)';


--
-- Name: COLUMN package_assignments.vendor_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.package_assignments.vendor_id IS 'Reference to the vendor (nullable if ngo_id is set)';


--
-- Name: COLUMN package_assignments.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.package_assignments.is_active IS 'Whether this assignment is currently active';


--
-- Name: packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ngo_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    amount numeric(10,2) NOT NULL,
    image_url text,
    category text,
    target_quantity integer,
    current_quantity integer DEFAULT 0,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT packages_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text])))
);


ALTER TABLE public.packages OWNER TO postgres;

--
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_requests (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_requests OWNER TO postgres;

--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_requests_id_seq OWNER TO postgres;

--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_requests_id_seq OWNED BY public.password_reset_requests.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    first_name text,
    last_name text,
    email text NOT NULL,
    phone text,
    password_hash text,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'ngo'::text, 'vendor'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transaction_id uuid NOT NULL,
    created_by_user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    category text NOT NULL,
    assigned_to_user_id uuid,
    resolution_notes text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tickets_category_check CHECK ((category = ANY (ARRAY['delivery_delay'::text, 'quality_issue'::text, 'missing_items'::text, 'wrong_delivery'::text, 'invoice_issue'::text, 'tracking_issue'::text, 'other'::text]))),
    CONSTRAINT tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])))
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    donation_id uuid NOT NULL,
    package_id uuid NOT NULL,
    ngo_id uuid NOT NULL,
    vendor_id uuid,
    donor_user_id uuid NOT NULL,
    status text DEFAULT 'pending_admin_assignment'::text NOT NULL,
    tracking_number text,
    delivery_note_url text,
    invoice_url text,
    admin_notes text,
    vendor_notes text,
    assigned_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transactions_status_check CHECK ((status = ANY (ARRAY['pending_admin_assignment'::text, 'assigned_to_vendor'::text, 'vendor_processing'::text, 'shipped'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text, 'issue_reported'::text])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: vendor_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_assignments (
    id integer NOT NULL,
    vendor_id uuid,
    package_id uuid,
    ngo_id uuid,
    assigned_at timestamp without time zone DEFAULT now(),
    delivery_date date,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    notes text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vendor_assignments OWNER TO postgres;

--
-- Name: vendor_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_assignments_id_seq OWNER TO postgres;

--
-- Name: vendor_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_assignments_id_seq OWNED BY public.vendor_assignments.id;


--
-- Name: vendor_package_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_package_assignments (
    id bigint NOT NULL,
    vendor_id uuid NOT NULL,
    package_assignment_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendor_package_assignments OWNER TO postgres;

--
-- Name: vendor_package_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_package_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_package_assignments_id_seq OWNER TO postgres;

--
-- Name: vendor_package_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_package_assignments_id_seq OWNED BY public.vendor_package_assignments.id;


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    company_name text NOT NULL,
    description text,
    website text,
    logo_url text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text,
    phone text,
    email text,
    business_type text,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Name: password_reset_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests ALTER COLUMN id SET DEFAULT nextval('public.password_reset_requests_id_seq'::regclass);


--
-- Name: vendor_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments ALTER COLUMN id SET DEFAULT nextval('public.vendor_assignments_id_seq'::regclass);


--
-- Name: vendor_package_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_package_assignments ALTER COLUMN id SET DEFAULT nextval('public.vendor_package_assignments_id_seq'::regclass);


--
-- Name: donations donations_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_invoice_number_key UNIQUE (invoice_number);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: ngos ngos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngos
    ADD CONSTRAINT ngos_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_id_key UNIQUE (order_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders orders_razorpay_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_razorpay_order_id_key UNIQUE (razorpay_order_id);


--
-- Name: package_assignments package_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_assignments
    ADD CONSTRAINT package_assignments_pkey PRIMARY KEY (id);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: package_assignments unique_package_ngo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_assignments
    ADD CONSTRAINT unique_package_ngo UNIQUE (package_id, ngo_id);


--
-- Name: package_assignments unique_package_vendor; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_assignments
    ADD CONSTRAINT unique_package_vendor UNIQUE (package_id, vendor_id);


--
-- Name: vendor_assignments vendor_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_pkey PRIMARY KEY (id);


--
-- Name: vendor_package_assignments vendor_package_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_package_assignments
    ADD CONSTRAINT vendor_package_assignments_pkey PRIMARY KEY (id);


--
-- Name: vendor_package_assignments vendor_package_assignments_vendor_id_package_assignment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_package_assignments
    ADD CONSTRAINT vendor_package_assignments_vendor_id_package_assignment_id_key UNIQUE (vendor_id, package_assignment_id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: idx_donations_payment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donations_payment_status ON public.donations USING btree (payment_status);


--
-- Name: idx_donations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donations_user_id ON public.donations USING btree (user_id);


--
-- Name: idx_ngos_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ngos_user_id ON public.ngos USING btree (user_id);


--
-- Name: idx_pa_ngo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pa_ngo ON public.package_assignments USING btree (ngo_id);


--
-- Name: idx_pa_pkg; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pa_pkg ON public.package_assignments USING btree (package_id);


--
-- Name: idx_pa_vendor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pa_vendor ON public.package_assignments USING btree (vendor_id);


--
-- Name: idx_package_assignments_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_assignments_active ON public.package_assignments USING btree (is_active);


--
-- Name: idx_package_assignments_ngo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_assignments_ngo_id ON public.package_assignments USING btree (ngo_id);


--
-- Name: idx_package_assignments_package_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_assignments_package_id ON public.package_assignments USING btree (package_id);


--
-- Name: idx_package_assignments_vendor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_assignments_vendor_id ON public.package_assignments USING btree (vendor_id);


--
-- Name: idx_packages_ngo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_packages_ngo_id ON public.packages USING btree (ngo_id);


--
-- Name: idx_packages_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_packages_status ON public.packages USING btree (status);


--
-- Name: idx_password_reset_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_email ON public.password_reset_requests USING btree (email);


--
-- Name: idx_password_reset_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_expires ON public.password_reset_requests USING btree (expires_at);


--
-- Name: idx_password_reset_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_token ON public.password_reset_requests USING btree (token);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_status ON public.tickets USING btree (status);


--
-- Name: idx_tickets_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_transaction_id ON public.tickets USING btree (transaction_id);


--
-- Name: idx_transactions_donor_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_donor_user_id ON public.transactions USING btree (donor_user_id);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);


--
-- Name: idx_transactions_vendor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_vendor_id ON public.transactions USING btree (vendor_id);


--
-- Name: idx_vendors_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_user_id ON public.vendors USING btree (user_id);


--
-- Name: donations update_donations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ngos update_ngos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ngos_updated_at BEFORE UPDATE ON public.ngos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: package_assignments update_package_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_package_assignments_updated_at BEFORE UPDATE ON public.package_assignments FOR EACH ROW EXECUTE FUNCTION public.update_package_assignments_updated_at();


--
-- Name: packages update_packages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tickets update_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendors update_vendors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: donations donations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: ngos ngos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngos
    ADD CONSTRAINT ngos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: orders orders_ngo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngos(id);


--
-- Name: orders orders_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);


--
-- Name: package_assignments package_assignments_ngo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_assignments
    ADD CONSTRAINT package_assignments_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngos(id) ON DELETE CASCADE;


--
-- Name: package_assignments package_assignments_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_assignments
    ADD CONSTRAINT package_assignments_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;


--
-- Name: package_assignments package_assignments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_assignments
    ADD CONSTRAINT package_assignments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: packages packages_ngo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngos(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.profiles(user_id);


--
-- Name: tickets tickets_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: tickets tickets_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_donation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES public.donations(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_donor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_donor_user_id_fkey FOREIGN KEY (donor_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: transactions transactions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: vendor_assignments vendor_assignments_ngo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngos(id);


--
-- Name: vendor_assignments vendor_assignments_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id);


--
-- Name: vendor_assignments vendor_assignments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: vendor_package_assignments vendor_package_assignments_package_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_package_assignments
    ADD CONSTRAINT vendor_package_assignments_package_assignment_id_fkey FOREIGN KEY (package_assignment_id) REFERENCES public.package_assignments(id) ON DELETE CASCADE;


--
-- Name: vendor_package_assignments vendor_package_assignments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_package_assignments
    ADD CONSTRAINT vendor_package_assignments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

