--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: domains; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.domains DISABLE TRIGGER ALL;

INSERT INTO public.domains VALUES ('localhost', 'localhost', 'Local Development Domain', 'Default domain for local development', true, '{}', '2025-07-13 15:07:27.093819+00', '2025-07-13 15:07:27.093819+00', 1000, 1000, 'enterprise', NULL, 'admin@localhost', NULL, NULL);


ALTER TABLE public.domains ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

INSERT INTO public.users VALUES (2, 'manager', 'manager@localhost', '2025-07-13 15:07:44.085781', '2025-07-13 15:07:44.085781', 'localhost', 'John', 'Manager', 'John Manager', NULL, NULL, NULL, NULL, true, NULL, '$2b$10$K7L/8Y3TAFHy.E4PdNn8aeUi.aZc0.cswxg6RGAGiYMu2Wt.Oq9S2');
INSERT INTO public.users VALUES (3, 'agent', 'agent@localhost', '2025-07-13 15:07:44.085781', '2025-07-13 15:07:44.085781', 'localhost', 'Bob', 'Agent', 'Bob Agent', NULL, NULL, NULL, NULL, true, NULL, '$2b$10$K7L/8Y3TAFHy.E4PdNn8aeUi.aZc0.cswxg6RGAGiYMu2Wt.Oq9S2');
INSERT INTO public.users VALUES (1, 'admin', 'admin@localhost', '2025-07-13 15:07:44.085781', '2025-07-13 15:07:44.085781', 'localhost', 'System', 'Administrator', 'System Administrator', NULL, NULL, NULL, NULL, true, NULL, '$2b$10$6RUEQZXBgdXZ7/kfJIOR7eLuV/1apXApNVV930Xv9f5NFABDqnieG');


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.audit_logs DISABLE TRIGGER ALL;

INSERT INTO public.audit_logs VALUES ('41ad2d49-812a-4560-97fd-289b0c031d16', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "mq873o2uwxifmgwr0etgi", "userAgent": "curl/8.7.1"}', NULL, NULL, '2025-07-13 21:57:09.507746+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('6d5bfb1c-02d0-4c81-b18f-27664ca88b6d', NULL, NULL, 'admin', 'login', 'failure', 'Login failed: Invalid password', NULL, NULL, NULL, NULL, '185.199.108.133', 'curl/8.7.1', NULL, 'medium', NULL, NULL, NULL, NULL, NULL, '{"reason": "Invalid password", "identifier": "admin"}', NULL, NULL, '2025-07-13 21:57:27.614279+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('a23d88b6-6fcd-4520-ab58-0993cfbf8b8b', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "eqmhk4nekai49zgwkfpggx", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}', NULL, NULL, '2025-07-13 21:58:05.781424+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('ff8f6ca6-fa77-4d11-915e-24e55c625991', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "ib8g7o8om7fngq7ephwvpi", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}', NULL, NULL, '2025-07-13 21:58:08.548373+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('4177ddcc-79f2-4e55-8cf3-93a6eca5df97', NULL, NULL, 'test@test.com', 'login', 'failure', 'Login failed: User not found', NULL, NULL, NULL, NULL, '185.199.108.133', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', NULL, 'medium', NULL, NULL, NULL, NULL, NULL, '{"reason": "User not found", "identifier": "test@test.com"}', NULL, NULL, '2025-07-13 22:00:44.389712+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('a88a48ee-25ce-46e4-8f78-fb346e4dbfaf', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "vrw17kem79oadkrogs06d7", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}', NULL, NULL, '2025-07-13 22:00:55.622923+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('2282201a-8554-4be5-8412-56955cf640e9', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "4xp6nnrz26w6450fnttvp", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}', NULL, NULL, '2025-07-13 22:01:03.281423+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('ee45384c-9425-4e1b-91b3-df953572ce22', NULL, NULL, NULL, 'logout', 'success', 'User logged out successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, '2025-07-13 22:22:03.359354+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('d8e00f5a-3676-49cf-8e7f-9d07bbcf8712', NULL, NULL, 'test@test.com', 'login', 'failure', 'Login failed: User not found', NULL, NULL, NULL, NULL, '185.199.108.133', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', NULL, 'medium', NULL, NULL, NULL, NULL, NULL, '{"reason": "User not found", "identifier": "test@test.com"}', NULL, NULL, '2025-07-13 22:22:08.986184+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('b67708f4-2be9-497c-8859-f49397e7956e', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "lypkipbqpgsalx89j6zpj", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}', NULL, NULL, '2025-07-13 22:22:11.548548+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('e82f3ae5-a00d-46c2-ac92-8b2fd36dc886', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "6df7cjny5prtx5uuxcnh1a", "userAgent": "curl/8.7.1"}', NULL, NULL, '2025-07-13 22:29:16.300225+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('740f19a7-3726-4d9b-a6cb-0ee61575970c', NULL, NULL, 'test@test.com', 'login', 'failure', 'Login failed: User not found', NULL, NULL, NULL, NULL, '185.199.108.133', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', NULL, 'medium', NULL, NULL, NULL, NULL, NULL, '{"reason": "User not found", "identifier": "test@test.com"}', NULL, NULL, '2025-07-13 22:29:54.736765+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('11c87c53-4192-4fd5-bc3e-21d00acf9ee4', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "v7a35q5iqn65qvrdy9hys", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}', NULL, NULL, '2025-07-13 22:30:00.2092+00', NULL, NULL, NULL, false);
INSERT INTO public.audit_logs VALUES ('f616033c-f9de-475f-8fbc-eb12785aad25', 1, NULL, NULL, 'login', 'success', 'User logged in successfully', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'low', NULL, NULL, NULL, NULL, NULL, '{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "zaxqz4ge3jnr0zuo2yzhmd", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}', NULL, NULL, '2025-07-13 22:30:07.934907+00', NULL, NULL, NULL, false);


ALTER TABLE public.audit_logs ENABLE TRIGGER ALL;

--
-- Data for Name: call_detail_records; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.call_detail_records DISABLE TRIGGER ALL;

INSERT INTO public.call_detail_records VALUES ('d198131a-0f63-4af2-a79f-16389d7f995a', 'bf25c690-0ec8-4f3f-875f-abf69769b873', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 12:08:51.455+00', NULL, '2025-07-13 12:08:53.013+00', NULL, '2025-07-13 12:09:17.733+00', 1, 24, 26, 24, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 20.03, 20.02, NULL, true, '20250713-120851_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 12:08:51.461169+00', '2025-07-13 12:09:17.748391+00', '2025-07-13 12:09:17.745+00');
INSERT INTO public.call_detail_records VALUES ('ef4e2da6-109f-4e00-82cf-c563cdd4b521', 'a80f6036-b339-4fa1-ac14-2d107b810b58', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 05:14:30.35+00', NULL, '2025-07-13 05:14:33.469+00', NULL, '2025-07-13 05:14:53.051+00', 3, 19, 22, 19, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.48, NULL, 32.00, 20.48, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:14:30.386108+00', '2025-07-13 05:14:53.0873+00', '2025-07-13 05:14:53.084+00');
INSERT INTO public.call_detail_records VALUES ('9934aca7-5cf5-45fe-8d0e-8f6e4f2dacac', 'f259483b-9f6e-4e55-bfd9-92d77ca5c230', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 05:14:30.294+00', NULL, '2025-07-13 05:14:33.494+00', NULL, '2025-07-13 05:14:53.07+00', 3, 19, 22, 19, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 8.00, 20.01, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:14:30.356009+00', '2025-07-13 05:14:53.105516+00', '2025-07-13 05:14:53.103+00');
INSERT INTO public.call_detail_records VALUES ('ee0fdb31-a1e2-43c2-baac-95e6ca4d0e76', '94e37cbb-0796-4399-9dae-5c1dfc15bfa9', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 05:25:06.093+00', NULL, '2025-07-13 05:25:10.492+00', NULL, '2025-07-13 05:25:16.71+00', 4, 6, 10, 6, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.36, NULL, 0.20, 20.43, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:25:06.159296+00', '2025-07-13 05:25:16.732089+00', '2025-07-13 05:25:16.726+00');
INSERT INTO public.call_detail_records VALUES ('37477546-f745-404d-8846-9be6cba6c386', '2289a269-3b01-4040-9a12-bd75b80e97e6', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 05:25:06.093+00', NULL, '2025-07-13 05:25:10.492+00', NULL, '2025-07-13 05:25:16.71+00', 4, 6, 10, 6, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 4.92, NULL, 0.42, 20.01, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:25:06.120632+00', '2025-07-13 05:25:16.732516+00', '2025-07-13 05:25:16.729+00');
INSERT INTO public.call_detail_records VALUES ('b8e8dd7b-2d26-4d67-8233-a169f45921d5', 'd4a2f14f-0a2d-441b-990d-27285b06fdab', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 05:49:52.272+00', NULL, NULL, NULL, '2025-07-13 05:50:22.053+00', 0, 0, 29, 0, 'completed', 'NO_ANSWER', NULL, NULL, '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:49:52.317201+00', '2025-07-13 05:50:22.105398+00', '2025-07-13 05:50:22.101+00');
INSERT INTO public.call_detail_records VALUES ('4008aed6-3217-4ea3-a7bc-707cdfed67f5', '086815a3-4ed6-461d-82d2-226a6507426c', NULL, NULL, '1001', NULL, 'voicemail', NULL, 'outbound', false, 'default', NULL, '2025-07-13 05:50:23.072+00', NULL, NULL, NULL, '2025-07-13 05:50:23.452+00', 0, 0, 0, 0, 'completed', 'NORMAL_CLEARING', NULL, NULL, '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:50:23.098038+00', '2025-07-13 05:50:23.481065+00', '2025-07-13 05:50:23.477+00');
INSERT INTO public.call_detail_records VALUES ('aebad4c4-d30a-44ed-9624-ef8fa2803087', 'd945fdcc-5ddb-46aa-8662-25c5f48f31db', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 05:49:52.252+00', NULL, '2025-07-13 05:50:22.072+00', NULL, '2025-07-13 05:50:23.476+00', 29, 1, 31, 1, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 107.85, 21.03, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:49:52.276836+00', '2025-07-13 05:50:23.510455+00', '2025-07-13 05:50:23.505+00');
INSERT INTO public.call_detail_records VALUES ('23c12445-e82c-4a78-82e4-cefb2102d61b', '6ae7cacb-dbe9-47a5-a4f7-ea3c89c63569', NULL, NULL, '1001', NULL, 'voicemail', NULL, 'outbound', false, 'default', NULL, '2025-07-13 05:50:23.072+00', NULL, NULL, NULL, '2025-07-13 05:50:23.476+00', 0, 0, 0, 0, 'completed', 'NORMAL_CLEARING', NULL, NULL, '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:50:23.097934+00', '2025-07-13 05:50:23.511375+00', '2025-07-13 05:50:23.507+00');
INSERT INTO public.call_detail_records VALUES ('71faa6af-c43d-423a-9959-fb7e3ce47db6', '85254a8e-720c-4ee7-8ddb-38d2e8da6a23', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 05:51:12.993+00', NULL, '2025-07-13 05:51:17.256+00', NULL, '2025-07-13 05:51:27.095+00', 4, 9, 14, 9, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.88, NULL, 4.50, 20.25, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:51:13.034563+00', '2025-07-13 05:51:27.138744+00', '2025-07-13 05:51:27.134+00');
INSERT INTO public.call_detail_records VALUES ('d789d214-6228-4ee0-b3d5-31c73f19b6eb', '6727802d-7041-421f-9543-d96cb422d9fc', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 05:51:12.993+00', NULL, '2025-07-13 05:51:17.292+00', NULL, '2025-07-13 05:51:27.095+00', 4, 9, 14, 9, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 3.00, 19.99, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 05:51:13.007039+00', '2025-07-13 05:51:27.139902+00', '2025-07-13 05:51:27.136+00');
INSERT INTO public.call_detail_records VALUES ('87d3b53d-24de-4bdf-a074-fe758ec4c630', '10b8ad4c-4b2c-43bc-8e48-cbf3e060f658', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 08:55:36.933+00', NULL, '2025-07-13 08:55:39.076+00', NULL, '2025-07-13 08:57:37.177+00', 2, 118, 120, 118, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 0.25, 19.99, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:04:32.30746+00', '2025-07-13 11:06:32.571354+00', '2025-07-13 11:06:32.566+00');
INSERT INTO public.call_detail_records VALUES ('510bcab9-5d51-445d-ba08-459cf4198523', 'e4710b25-5b75-4250-8b4c-1a9dd05b7f40', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 08:55:36.953+00', NULL, '2025-07-13 08:55:39.076+00', NULL, '2025-07-13 08:57:37.177+00', 2, 118, 120, 118, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.88, NULL, 0.33, 20.13, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:04:32.320854+00', '2025-07-13 11:06:32.572278+00', '2025-07-13 11:06:32.568+00');
INSERT INTO public.call_detail_records VALUES ('5f13b4bd-8670-4d63-b965-f5e3c8420aab', 'a7af0d3b-10bd-40e0-ac48-a57eb3d70e40', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:29:43.973+00', NULL, '2025-07-13 11:29:46.474+00', NULL, '2025-07-13 11:29:56.534+00', 2, 10, 12, 10, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.80, NULL, 244.40, 20.10, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:29:44.01292+00', '2025-07-13 11:29:56.565385+00', '2025-07-13 11:29:56.562+00');
INSERT INTO public.call_detail_records VALUES ('0a0abbf3-7db7-4e85-9e6e-54c06fe397f5', 'afcefe82-6ada-46d8-ad51-bf07a2e5aee0', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:29:43.953+00', NULL, '2025-07-13 11:29:46.474+00', NULL, '2025-07-13 11:29:56.534+00', 2, 10, 12, 10, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 40.13, 20.06, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:29:43.990291+00', '2025-07-13 11:29:56.581721+00', '2025-07-13 11:29:56.579+00');
INSERT INTO public.call_detail_records VALUES ('7aa24b34-81ae-4243-8467-997afce8ab01', '03570beb-66b6-40df-82a5-1ab2e2052e31', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:32:34.979+00', NULL, '2025-07-13 11:32:36.736+00', NULL, '2025-07-13 11:32:49.3+00', 1, 12, 14, 12, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.92, NULL, 104.04, 20.07, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:32:35.031855+00', '2025-07-13 11:32:49.375927+00', '2025-07-13 11:32:49.373+00');
INSERT INTO public.call_detail_records VALUES ('91c120d9-d1e3-4f3c-a824-3225c358ce9d', '0b9becf6-b47f-47cd-a588-d36df4aa8b5c', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:32:34.936+00', NULL, '2025-07-13 11:32:36.756+00', NULL, '2025-07-13 11:32:49.337+00', 1, 12, 14, 12, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 153.51, 20.09, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:32:35.000679+00', '2025-07-13 11:32:49.376359+00', '2025-07-13 11:32:49.374+00');
INSERT INTO public.call_detail_records VALUES ('320ca184-32d3-48d4-a687-926268ccae4a', '92de9707-9a1c-4520-8077-4578b95f2053', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:35:34.363+00', NULL, '2025-07-13 11:35:35.943+00', NULL, '2025-07-13 11:35:45.241+00', 1, 9, 10, 9, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.96, NULL, 0.50, 20.10, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:35:34.413929+00', '2025-07-13 11:35:45.295179+00', '2025-07-13 11:35:45.289+00');
INSERT INTO public.call_detail_records VALUES ('06dfddd4-5d0a-4c29-bff7-f2c193c5c518', 'b4975436-e743-4504-8c0b-4130c63d4f33', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:35:34.323+00', NULL, '2025-07-13 11:35:35.943+00', NULL, '2025-07-13 11:35:45.241+00', 1, 9, 10, 9, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 0.06, 19.97, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:35:34.381986+00', '2025-07-13 11:35:45.295697+00', '2025-07-13 11:35:45.292+00');
INSERT INTO public.call_detail_records VALUES ('8b536f66-207c-4f55-85fe-77b92ff0ce61', '3d2fc6cf-07cf-4ae4-93cc-d136a3e10860', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:37:45.493+00', NULL, NULL, NULL, '2025-07-13 11:37:52.133+00', 0, 0, 6, 0, 'completed', 'ORIGINATOR_CANCEL', NULL, NULL, '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:37:45.54417+00', '2025-07-13 11:37:52.164749+00', '2025-07-13 11:37:52.16+00');
INSERT INTO public.call_detail_records VALUES ('582ac511-2b3b-46e6-9691-3c05616d980f', 'd61bc407-c5f6-43d3-a9c6-51388c60232d', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:37:45.513+00', NULL, NULL, NULL, '2025-07-13 11:37:52.133+00', 0, 0, 6, 0, 'completed', 'ORIGINATOR_CANCEL', NULL, NULL, '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:37:45.571138+00', '2025-07-13 11:37:52.166669+00', '2025-07-13 11:37:52.162+00');
INSERT INTO public.call_detail_records VALUES ('39871220-2c4e-4817-8322-73be6a77bb18', 'e4780ea0-b791-4eaf-a323-ae49b8d200cc', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:37:55.333+00', NULL, NULL, NULL, '2025-07-13 11:38:07.433+00', 0, 0, 12, 0, 'completed', 'ORIGINATOR_CANCEL', NULL, NULL, '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:37:55.366642+00', '2025-07-13 11:38:07.474523+00', '2025-07-13 11:38:07.471+00');
INSERT INTO public.call_detail_records VALUES ('cd8e1310-d146-4387-b643-55a1aa49b2f9', '3f3bf4a3-4733-4612-9706-ff1406fa01b7', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:37:55.313+00', NULL, NULL, NULL, '2025-07-13 11:38:07.433+00', 0, 0, 12, 0, 'completed', 'ORIGINATOR_CANCEL', NULL, NULL, '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:37:55.345743+00', '2025-07-13 11:38:07.474939+00', '2025-07-13 11:38:07.473+00');
INSERT INTO public.call_detail_records VALUES ('c833cb92-e655-40d9-ad6a-c125303849b3', 'cbb115b6-dbe1-4444-a021-dd821ecb2a88', NULL, NULL, '1002', NULL, '1001', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:41:11.393+00', NULL, '2025-07-13 11:41:14.993+00', NULL, '2025-07-13 11:41:20.693+00', 3, 5, 9, 5, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 5.00, NULL, 0.20, 20.00, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:41:11.435128+00', '2025-07-13 11:41:20.736426+00', '2025-07-13 11:41:20.733+00');
INSERT INTO public.call_detail_records VALUES ('726980fb-7a65-40eb-973d-6bb3fe3fd83a', '7d85ef89-ac21-4545-b565-5baed4a48511', NULL, NULL, '1002', NULL, '1001', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:41:11.393+00', NULL, '2025-07-13 11:41:15.013+00', NULL, '2025-07-13 11:41:20.693+00', 3, 5, 9, 5, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Zoiper v2.10.20.6', NULL, NULL, NULL, NULL, 4.96, NULL, 0.13, 20.10, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:41:11.421255+00', '2025-07-13 11:41:20.737127+00', '2025-07-13 11:41:20.734+00');
INSERT INTO public.call_detail_records VALUES ('44feaca3-f8fd-4ede-8c0d-f81f212d87e2', '71a2542a-4022-47dc-a53b-d7ec07a8d19a', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:46:25.913+00', NULL, '2025-07-13 11:46:27.153+00', NULL, '2025-07-13 11:46:34.634+00', 1, 7, 8, 7, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.88, NULL, 14.93, 20.13, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:46:25.978902+00', '2025-07-13 11:46:34.673536+00', '2025-07-13 11:46:34.671+00');
INSERT INTO public.call_detail_records VALUES ('035c3831-443a-4ab8-8dd7-f700d45e6bf8', '8d6ce40d-c852-4f4d-b9c7-1ccfe4ee429f', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:46:25.876+00', NULL, '2025-07-13 11:46:27.173+00', NULL, '2025-07-13 11:46:34.634+00', 1, 7, 8, 7, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 0.30, 20.00, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:46:25.94474+00', '2025-07-13 11:46:34.691543+00', '2025-07-13 11:46:34.689+00');
INSERT INTO public.call_detail_records VALUES ('5c7c2471-8047-43e1-9845-b98691c19b04', '90b98d3a-49c5-4ab1-8a2c-f734e5ea75d5', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:49:06.713+00', NULL, '2025-07-13 11:49:09.253+00', NULL, '2025-07-13 11:49:17.393+00', 2, 8, 10, 8, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.88, NULL, 76.26, 20.23, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:49:06.803239+00', '2025-07-13 11:49:17.445729+00', '2025-07-13 11:49:17.441+00');
INSERT INTO public.call_detail_records VALUES ('436a0ac7-f364-410b-9052-c006fd37c0c5', 'd549b18e-d08c-4920-be0b-bc905126c41c', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:49:06.693+00', NULL, '2025-07-13 11:49:09.253+00', NULL, '2025-07-13 11:49:17.393+00', 2, 8, 10, 8, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 0.06, 20.00, NULL, false, NULL, false, false, false, NULL, NULL, NULL, '2025-07-13 11:49:06.749668+00', '2025-07-13 11:49:17.446326+00', '2025-07-13 11:49:17.443+00');
INSERT INTO public.call_detail_records VALUES ('4d97fade-92cb-4646-97ff-e72d07887bda', '301745c4-9361-4e7b-a674-c3b38d69cecd', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:55:10.833+00', NULL, '2025-07-13 11:55:12.333+00', NULL, '2025-07-13 11:55:20.073+00', 1, 7, 9, 7, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.88, NULL, 89.64, 20.13, NULL, true, '20250713-115510_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 11:55:10.885885+00', '2025-07-13 11:55:20.084368+00', '2025-07-13 11:55:20.08+00');
INSERT INTO public.call_detail_records VALUES ('bd5c2a40-6453-43f1-83ab-b9475725a85b', '7544108a-2c85-47b4-b66c-2dc4044d2635', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 11:57:25.093+00', NULL, '2025-07-13 11:57:26.573+00', NULL, '2025-07-13 11:57:32.533+00', 1, 5, 7, 5, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.88, NULL, 162.71, 20.00, NULL, true, '20250713-115725_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 11:57:25.113107+00', '2025-07-13 11:57:32.545199+00', '2025-07-13 11:57:32.542+00');
INSERT INTO public.call_detail_records VALUES ('935cca90-516e-4b04-b7b1-a782685f7cac', '5343fcce-43e8-4bd8-8a83-10296f62cde0', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 12:08:51.473+00', NULL, '2025-07-13 12:08:53.013+00', NULL, '2025-07-13 12:09:17.733+00', 1, 24, 26, 24, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.88, NULL, 66.96, 20.14, NULL, true, '20250713-120851_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 12:08:51.494485+00', '2025-07-13 12:09:17.72091+00', '2025-07-13 12:09:17.718+00');
INSERT INTO public.call_detail_records VALUES ('3bab9962-08cf-4d9a-bafe-044636bcc2f0', '08b0c3d5-7e90-4e70-959b-069b1e32f32d', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 22:21:14.042+00', NULL, '2025-07-13 22:21:16.165+00', NULL, '2025-07-13 22:21:26.643+00', 2, 10, 12, 10, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.92, NULL, 1.08, 20.12, NULL, true, '20250713-222114_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 22:37:50.351294+00', '2025-07-13 22:38:02.967503+00', '2025-07-13 22:38:02.964+00');
INSERT INTO public.call_detail_records VALUES ('6f7911b0-4c88-4abe-bb8d-158b83f68161', '65118f76-01e2-4027-9a87-df40b97efbef', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', true, 'default', NULL, '2025-07-13 22:59:42.21+00', NULL, '2025-07-13 22:59:49.789+00', NULL, '2025-07-13 23:00:00.89+00', 7, 11, 18, 11, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, NULL, NULL, NULL, NULL, NULL, 4.88, NULL, 3.00, 20.17, NULL, true, '20250713-225942_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 22:59:42.253418+00', '2025-07-13 23:00:00.933468+00', '2025-07-13 23:00:00.928+00');
INSERT INTO public.call_detail_records VALUES ('e8f5ad69-975b-476a-afa8-437c7653625a', '3d42bd4b-c5ed-429b-a058-1376632a9e0f', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:55:10.833+00', NULL, '2025-07-13 11:55:12.353+00', NULL, '2025-07-13 11:55:20.073+00', 1, 7, 9, 7, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 0.11, 19.95, NULL, true, '20250713-115510_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 11:55:10.85345+00', '2025-07-13 11:55:20.084946+00', '2025-07-13 11:55:20.081+00');
INSERT INTO public.call_detail_records VALUES ('3d013563-ec65-44ee-ab75-e83bbc3c54b1', '320f02e3-6386-4b67-9b22-5feaae9d354e', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 22:21:14.006+00', NULL, '2025-07-13 22:21:16.165+00', NULL, '2025-07-13 22:21:26.662+00', 2, 10, 12, 10, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 5.33, 19.96, NULL, true, '20250713-222114_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 22:37:50.321979+00', '2025-07-13 22:38:02.98191+00', '2025-07-13 22:38:02.979+00');
INSERT INTO public.call_detail_records VALUES ('4a7438e9-80ff-4ed7-ac6b-c5018aeba4c6', 'e79bbcf9-7a3f-49f3-9968-018ef662fff1', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 11:57:25.073+00', NULL, '2025-07-13 11:57:26.573+00', NULL, '2025-07-13 11:57:32.533+00', 1, 5, 7, 5, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 0.25, 20.00, NULL, true, '20250713-115725_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 11:57:25.094527+00', '2025-07-13 11:57:32.55929+00', '2025-07-13 11:57:32.557+00');
INSERT INTO public.call_detail_records VALUES ('36ceb8ba-2d1b-4269-b2c4-ab7dfbf5cba2', 'd444ff58-2459-49c2-9636-231a760e095f', NULL, NULL, '1001', NULL, '1002', NULL, 'internal', false, 'default', 'localhost', '2025-07-13 22:59:42.17+00', NULL, '2025-07-13 22:59:49.789+00', NULL, '2025-07-13 23:00:00.89+00', 7, 11, 18, 11, 'completed', 'NORMAL_CLEARING', NULL, 'answered', '185.199.108.133', NULL, 'Z 5.6.9 v2.10.20.8', NULL, NULL, NULL, NULL, 5.00, NULL, 4.50, 19.90, NULL, true, '20250713-225942_1001_1002.wav', false, false, false, NULL, NULL, NULL, '2025-07-13 22:59:42.232486+00', '2025-07-13 23:00:00.93388+00', '2025-07-13 23:00:00.931+00');


ALTER TABLE public.call_detail_records ENABLE TRIGGER ALL;

--
-- Data for Name: call_events; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.call_events DISABLE TRIGGER ALL;



ALTER TABLE public.call_events ENABLE TRIGGER ALL;

--
-- Data for Name: call_participants; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.call_participants DISABLE TRIGGER ALL;



ALTER TABLE public.call_participants ENABLE TRIGGER ALL;

--
-- Data for Name: call_recordings; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.call_recordings DISABLE TRIGGER ALL;



ALTER TABLE public.call_recordings ENABLE TRIGGER ALL;

--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.permissions DISABLE TRIGGER ALL;

INSERT INTO public.permissions VALUES ('perm-system-manage', 'system:manage', 'system', 'manage', 'Full system management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'system', true, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-system-read', 'system:read', 'system', 'read', 'Read system information', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'system', true, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-domain-manage', 'domain:manage', 'domain', 'manage', 'Full domain management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'domain', true, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-domain-read', 'domain:read', 'domain', 'read', 'Read domain information', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'domain', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-domain-create', 'domain:create', 'domain', 'create', 'Create new domains', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'domain', true, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-domain-update', 'domain:update', 'domain', 'update', 'Update domain settings', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'domain', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-domain-delete', 'domain:delete', 'domain', 'delete', 'Delete domains', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'domain', true, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-users-manage', 'users:manage', 'users', 'manage', 'Full user management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'users', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-users-read', 'users:read', 'users', 'read', 'Read user information', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'users', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-users-create', 'users:create', 'users', 'create', 'Create new users', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'users', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-users-update', 'users:update', 'users', 'update', 'Update user information', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'users', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-users-delete', 'users:delete', 'users', 'delete', 'Delete users', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'users', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-calls-manage', 'calls:manage', 'calls', 'manage', 'Full call management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'calls', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-calls-read', 'calls:read', 'calls', 'read', 'View call information', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'calls', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-calls-execute', 'calls:execute', 'calls', 'execute', 'Make and control calls', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'calls', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-extensions-manage', 'extensions:manage', 'extensions', 'manage', 'Full extension management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'extensions', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-extensions-read', 'extensions:read', 'extensions', 'read', 'View extension information', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'extensions', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-extensions-create', 'extensions:create', 'extensions', 'create', 'Create new extensions', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'extensions', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-extensions-update', 'extensions:update', 'extensions', 'update', 'Update extension settings', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'extensions', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-extensions-delete', 'extensions:delete', 'extensions', 'delete', 'Delete extensions', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'extensions', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-cdr-manage', 'cdr:manage', 'cdr', 'manage', 'Full CDR management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'cdr', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-cdr-read', 'cdr:read', 'cdr', 'read', 'View call detail records', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'cdr', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-cdr-delete', 'cdr:delete', 'cdr', 'delete', 'Delete call records', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'cdr', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-recordings-manage', 'recordings:manage', 'recordings', 'manage', 'Full recording management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'recordings', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-recordings-read', 'recordings:read', 'recordings', 'read', 'Listen to recordings', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'recordings', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-recordings-create', 'recordings:create', 'recordings', 'create', 'Create recordings', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'recordings', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-recordings-delete', 'recordings:delete', 'recordings', 'delete', 'Delete recordings', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'recordings', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-config-manage', 'config:manage', 'config', 'manage', 'Full configuration management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'config', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-config-read', 'config:read', 'config', 'read', 'View configuration', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'config', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-config-update', 'config:update', 'config', 'update', 'Update configuration', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'config', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-reports-read', 'reports:read', 'reports', 'read', 'View reports', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'reports', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-reports-create', 'reports:create', 'reports', 'create', 'Generate reports', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'reports', false, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-security-manage', 'security:manage', 'security', 'manage', 'Full security management', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'security', true, NULL, NULL);
INSERT INTO public.permissions VALUES ('perm-security-read', 'security:read', 'security', 'read', 'View security information', true, '2025-07-13 21:36:58.932997+00', '2025-07-13 21:36:58.932997+00', 'security', false, NULL, NULL);


ALTER TABLE public.permissions ENABLE TRIGGER ALL;

--
-- Data for Name: policies; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.policies DISABLE TRIGGER ALL;



ALTER TABLE public.policies ENABLE TRIGGER ALL;

--
-- Data for Name: recording_access_logs; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.recording_access_logs DISABLE TRIGGER ALL;



ALTER TABLE public.recording_access_logs ENABLE TRIGGER ALL;

--
-- Data for Name: recording_tags; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.recording_tags DISABLE TRIGGER ALL;



ALTER TABLE public.recording_tags ENABLE TRIGGER ALL;

--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.roles DISABLE TRIGGER ALL;

INSERT INTO public.roles VALUES ('role-superadmin', 'superadmin', 'Super Administrator', 'Super Administrator - Full system access', 'global', 0, true, NULL, NULL, '2025-07-13 21:36:58.936417+00', '2025-07-13 21:36:58.936417+00', true, false, '{}', '{}', NULL);
INSERT INTO public.roles VALUES ('role-system-admin', 'system_admin', 'System Administrator', 'System Administrator - System management', 'global', 10, true, NULL, NULL, '2025-07-13 21:36:58.936417+00', '2025-07-13 21:36:58.936417+00', true, false, '{}', '{}', NULL);
INSERT INTO public.roles VALUES ('role-domain-admin', 'domain_admin', 'Domain Administrator', 'Domain Administrator - Full domain access', 'domain', 20, true, 'localhost', NULL, '2025-07-13 21:36:58.936417+00', '2025-07-13 21:36:58.936417+00', false, false, '{}', '{}', NULL);
INSERT INTO public.roles VALUES ('role-manager', 'manager', 'Manager', 'Manager - Department management', 'domain', 30, true, 'localhost', NULL, '2025-07-13 21:36:58.936417+00', '2025-07-13 21:36:58.936417+00', false, false, '{}', '{}', NULL);
INSERT INTO public.roles VALUES ('role-supervisor', 'supervisor', 'Supervisor', 'Supervisor - Team supervision', 'domain', 50, true, 'localhost', NULL, '2025-07-13 21:36:58.936417+00', '2025-07-13 21:36:58.936417+00', false, false, '{}', '{}', NULL);
INSERT INTO public.roles VALUES ('role-agent', 'agent', 'Agent', 'Agent - Call handling', 'domain', 70, true, 'localhost', NULL, '2025-07-13 21:36:58.936417+00', '2025-07-13 21:36:58.936417+00', false, true, '{}', '{}', NULL);
INSERT INTO public.roles VALUES ('role-user', 'user', 'User', 'User - Basic access', 'domain', 80, true, 'localhost', NULL, '2025-07-13 21:36:58.936417+00', '2025-07-13 21:36:58.936417+00', false, false, '{}', '{}', NULL);


ALTER TABLE public.roles ENABLE TRIGGER ALL;

--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.role_permissions DISABLE TRIGGER ALL;

INSERT INTO public.role_permissions VALUES (39, 'role-superadmin', 'perm-system-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (40, 'role-superadmin', 'perm-system-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (41, 'role-superadmin', 'perm-domain-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (42, 'role-superadmin', 'perm-domain-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (43, 'role-superadmin', 'perm-domain-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (44, 'role-superadmin', 'perm-domain-update', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (45, 'role-superadmin', 'perm-domain-delete', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (46, 'role-superadmin', 'perm-users-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (47, 'role-superadmin', 'perm-users-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (48, 'role-superadmin', 'perm-users-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (49, 'role-superadmin', 'perm-users-update', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (50, 'role-superadmin', 'perm-users-delete', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (51, 'role-superadmin', 'perm-calls-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (52, 'role-superadmin', 'perm-calls-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (53, 'role-superadmin', 'perm-calls-execute', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (54, 'role-superadmin', 'perm-extensions-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (55, 'role-superadmin', 'perm-extensions-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (56, 'role-superadmin', 'perm-extensions-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (57, 'role-superadmin', 'perm-extensions-update', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (58, 'role-superadmin', 'perm-extensions-delete', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (59, 'role-superadmin', 'perm-cdr-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (60, 'role-superadmin', 'perm-cdr-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (61, 'role-superadmin', 'perm-cdr-delete', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (62, 'role-superadmin', 'perm-recordings-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (63, 'role-superadmin', 'perm-recordings-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (64, 'role-superadmin', 'perm-recordings-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (65, 'role-superadmin', 'perm-recordings-delete', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (66, 'role-superadmin', 'perm-config-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (67, 'role-superadmin', 'perm-config-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (68, 'role-superadmin', 'perm-config-update', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (69, 'role-superadmin', 'perm-reports-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (70, 'role-superadmin', 'perm-reports-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (71, 'role-superadmin', 'perm-security-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (72, 'role-superadmin', 'perm-security-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (73, 'role-system-admin', 'perm-system-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (74, 'role-system-admin', 'perm-domain-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (75, 'role-system-admin', 'perm-users-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (76, 'role-system-admin', 'perm-config-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (77, 'role-system-admin', 'perm-security-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (78, 'role-system-admin', 'perm-reports-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (79, 'role-system-admin', 'perm-reports-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (80, 'role-domain-admin', 'perm-domain-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (81, 'role-domain-admin', 'perm-domain-update', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (82, 'role-domain-admin', 'perm-users-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (83, 'role-domain-admin', 'perm-calls-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (84, 'role-domain-admin', 'perm-extensions-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (85, 'role-domain-admin', 'perm-cdr-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (86, 'role-domain-admin', 'perm-recordings-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (87, 'role-domain-admin', 'perm-config-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (88, 'role-domain-admin', 'perm-config-update', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (89, 'role-domain-admin', 'perm-reports-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (90, 'role-domain-admin', 'perm-reports-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (91, 'role-domain-admin', 'perm-security-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (92, 'role-manager', 'perm-users-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (93, 'role-manager', 'perm-users-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (94, 'role-manager', 'perm-users-update', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (95, 'role-manager', 'perm-calls-manage', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (96, 'role-manager', 'perm-extensions-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (97, 'role-manager', 'perm-extensions-create', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (98, 'role-manager', 'perm-extensions-update', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (99, 'role-manager', 'perm-cdr-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (100, 'role-manager', 'perm-recordings-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (101, 'role-manager', 'perm-reports-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (102, 'role-supervisor', 'perm-users-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (103, 'role-supervisor', 'perm-calls-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (104, 'role-supervisor', 'perm-calls-execute', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (105, 'role-supervisor', 'perm-extensions-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (106, 'role-supervisor', 'perm-cdr-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (107, 'role-supervisor', 'perm-recordings-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (108, 'role-supervisor', 'perm-reports-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (109, 'role-agent', 'perm-calls-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (110, 'role-agent', 'perm-calls-execute', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (111, 'role-agent', 'perm-extensions-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (112, 'role-agent', 'perm-cdr-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (113, 'role-agent', 'perm-recordings-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (114, 'role-user', 'perm-calls-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (115, 'role-user', 'perm-extensions-read', true, '2025-07-13 21:36:58.936417', NULL);
INSERT INTO public.role_permissions VALUES (116, 'role-user', 'perm-cdr-read', true, '2025-07-13 21:36:58.936417', NULL);


ALTER TABLE public.role_permissions ENABLE TRIGGER ALL;

--
-- Data for Name: user_attributes; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.user_attributes DISABLE TRIGGER ALL;



ALTER TABLE public.user_attributes ENABLE TRIGGER ALL;

--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

ALTER TABLE public.user_roles DISABLE TRIGGER ALL;

INSERT INTO public.user_roles VALUES (4, 1, 'role-superadmin', true, true, NULL, '2025-07-13 21:36:58.936417+00', 'system', 'Initial setup', NULL, NULL, '2025-07-13 21:36:58.936417+00', '2025-07-13 21:36:58.936417+00', NULL, NULL, NULL);


ALTER TABLE public.user_roles ENABLE TRIGGER ALL;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pbx_user
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 116, true);


--
-- Name: user_attributes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pbx_user
--

SELECT pg_catalog.setval('public.user_attributes_id_seq', 1, false);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pbx_user
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pbx_user
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

